window.onload = async () => {
    'use strict';
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch((err) => {
            console.error("SW登録失敗:", err);
        });
    }

    // 1. まず天気と自宅判定データを最新にする（裏で終わるのを待つ）
    await Update_weather();

    // 2. データが確定した後に、メッセージを画面に表示する
    Check_display(); 
    
    // 3. 1分ごとの更新タイマーを起動
    Next_minute_timer();

    window.addEventListener('focus', () => {
        Check_display();
    });
};

function Next_minute_timer() {
    let now = new Date();
    let delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    
    setTimeout(() => {
        window.location.reload();
    }, delay);
}


// 位置情報を取得し、APIから天気を取得 ＆ 自宅判定を行う関数

function Update_weather() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log("Geolocation非対応");
            Set_default("曇り", true); 
            return resolve();
        }

        // エラーデータであっても、1時間以内ならGPSを再取得せず、現在のキャッシュをそのまま使って即resolveする
        let cachedWeather = JSON.parse(localStorage.getItem('cached_weather'));
        if (cachedWeather && (Date.now() - cachedWeather.updatedAt < 3600000)) {
            if (!cachedWeather.isError) {
                Remove_error();  
            }
            return resolve();
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;

            //自宅情報が設定されていない場合、東京が自動設定される
            let savedHome = JSON.parse(localStorage.getItem('user_home'));
            let HOME_LAT = savedHome ? savedHome.lat : 35.6895; 
            let HOME_LON = savedHome ? savedHome.lon : 139.6917;
            
            let distance = get_distance_weather(lat, lon, HOME_LAT, HOME_LON);
            let isHome = distance <= 50; 

            try {
                let response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                let data = await response.json();
                let weatherCode = data.current_weather.weathercode;
                
                //天気が何かを判定
                let weatherString = "晴れ";
                if (weatherCode >= 51 && weatherCode <= 67) { weatherString = "雨"; }
                else if (weatherCode >= 71 && weatherCode <= 86) { weatherString = "雪"; }
                else if (weatherCode >= 1 && weatherCode <= 3) { weatherString = "曇り"; }

                //今の情報を保存
                let weatherInfo = {
                    status: weatherString, //今の天気が何か
                    isHome: isHome,        //今自宅にいるかどうか（自宅にいるとtrue）
                    updatedAt: Date.now(), //最後にデータが保存、変更された時間
                    isError: false         //位置情報エラーになっているかどうか(エラーじゃなかったらfalse)
                };
                localStorage.setItem('cached_weather', JSON.stringify(weatherInfo));
                
                Remove_error();
                resolve(); 

            } catch (error) {
                console.error("API取得失敗:", error);
                Set_default("曇り", isHome, true); // エラー時も自宅判定は活かす
                resolve();
            }
        }, (error) => {
            console.warn(`位置情報エラー (コード: ${error.code})。一時的に曇り・自宅として処理します。`);
            Set_default("曇り", true, true); 
            
            // try {
            //     Display_error(error); 
            //} catch(e) {
            //   console.error("エラー表示処理でクラッシュしましたが、続行します:", e);
            //}
            resolve();
        }, {
            enableHighAccuracy: true, 
            timeout: 5000,            
            maximumAge: 0
        });
    });
}

function get_distance_weather(lat1, lon1, lat2, lon2) {
    let R = 6371000; 
    let dLat = (lat2 - lat1) * Math.PI / 180;
    let dLon = (lon2 - lon1) * Math.PI / 180;
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function Set_default(statusString, isHome = true, isError = false) {
    let weatherInfo = {
        status: statusString,
        isHome: isHome,
        updatedAt: Date.now(),
        isError: isError
    };
    localStorage.setItem('cached_weather', JSON.stringify(weatherInfo));
}

//エラーを表示する関数（削除予定※test用）
function Display_error(error) {
    let messageBox = document.getElementById('message_box');
    if (!messageBox) return;

    Remove_error();

    let errorDiv = document.createElement('div');
    errorDiv.id = 'location_error_notice';
    errorDiv.style.cssText = `
        background-color: #fff0f3;
        border: 2px dashed #ff4a79;
        border-radius: 8px;
        padding: 5px;
        margin-top: 5px;
        font-size: 0.5em;
        color: #d61c4e;
        line-height: 1.4;
    `;

    if (error.code === error.PERMISSION_DENIED) {
        errorDiv.innerHTML = "❌ <b>位置情報がブロックされています</b><br>天気が連動しなくなっちゃうから、ブラウザの設定から位置情報を許可してね！";
    } else if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
        errorDiv.innerHTML = "❌ <b>位置情報が取得できません</b><br>GPS設定や電波を確認してみてね！";
    } else {
        errorDiv.innerHTML = `❌ <b>位置情報エラー (コード: ${error.code})</b>`;
    }

    let retryBtn = document.createElement('button');
    retryBtn.textContent = "再読み込み";
    retryBtn.style.cssText = `
        display: block;
        margin: 2px auto 0 auto;
        padding: 4px 12px;
        background-color: #ff4a79;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.9em;
        font-weight: bold;
        cursor: pointer;
    `;
    retryBtn.onclick = () => { window.location.reload(); };

    errorDiv.appendChild(retryBtn);
    messageBox.appendChild(errorDiv);
}

function Remove_error() {
    let existingNotice = document.getElementById('location_error_notice');
    if (existingNotice) {
        existingNotice.remove();
    }
}
//セリフを表示する関数
function Check_display() {
    let taskTalkElement = document.getElementById('message');
    if (!taskTalkElement) return;

    let now = new Date();
    let currentHour = now.getHours();   
    let currentMinute = now.getMinutes(); 
    let currentDay = now.getDay();       

    let displayHour = String(currentHour).padStart(2, '0');
    let displayMinute = String(currentMinute).padStart(2, '0');
    let currentTimeString = `${displayHour}:${displayMinute}`;

    let isWeekend = (currentDay === 0 || currentDay === 6);

    // ==========================================
    // 1.ユーザーが設定したジャンル別セリフ
    // ==========================================
    let userGenre = null;
    let genreTalks = [];

    // 現在の時間と、各設定時間が一致するか個別に確認する
    if(currentTimeString === localStorage.getItem('breakfast')) {
        userGenre = "朝ごはん";
        genreTalks = [
            "おはよう！朝ごはん食べないとお昼まできついぞ～",
            "おっは～！忙しいのはわかるけど、ちゃんと朝ご飯食べなよ～？",
            "おはよん～朝ごはんしっかり食べて今日一日頑張ってこ～！"
        ];
    } else if (currentTimeString === localStorage.getItem('dinner')) {
        userGenre = "夜ごはん";
        genreTalks = [
            "お疲れさま～疲れたっしょ～\n夜ごはんいっぱい食べてリセットしよ！", 
            "おつおつ～めっちゃお腹すいた！！\nあんたも夜ごはんちゃんと食べるんだよ～",
            "お疲れ様！夜ごはん食べてきた～？それとも今から？"
        ];
    } else if (currentTimeString === localStorage.getItem('bath')) {
        userGenre = "お風呂";
        genreTalks = [
            "ねえ～もしかしてだけど、お風呂入ってないなんてことはないよね？", 
            "もうお風呂入る時間だよ～\n早くお風呂入ってすっきりしよ！",
            "風呂キャンではないよね…？\nお風呂入ってきてよ～？"
        ];
    } else if (currentTimeString === localStorage.getItem('time_sleep')) {
        userGenre = "睡眠";
        genreTalks = [
            "スマホばっかやってないよね？早く寝ろ！！", 
            "早く寝ないと健康に悪いぞー。お布団入りな？",
            "夜更かしは美容の敵！早くお布団に入って！"
        ];
    } else if (currentTimeString === localStorage.getItem('time_exercise')) {
        userGenre = "運動";
        genreTalks = [
            "ちゃんと運動しないとだめだぞ〜太るぞ！！動け！！",
            "最近体重計乗った？\n自分磨きしてけ〜？",
            "ずっと座りっぱなしじゃない？ちょっとストレッチしなよ！"
        ];
    } else if (currentTimeString === localStorage.getItem('time_cooking')) {
        userGenre = "料理";
        genreTalks = [
            "炊飯器放置してないよね？！\nお米カピカピになるよ！",
            "冷蔵庫に何入ってる〜？\n賞味期限切らせてないよね？！",
            "食べた後皿洗った？\n放置したらダメだからね！"
        ];
    }

    // もし時間が一致するジャンルがあれば、ランダムでセリフを表示して終了する
    if (userGenre && genreTalks.length > 0) {
        let randomIndex = Math.floor(Math.random() * genreTalks.length);
        taskTalkElement.textContent = `【${userGenre}】${genreTalks[randomIndex]}`;
        return; 
    }
    
    // ==========================================
    // 2.分単位で確実に欲しい通知
    // ==========================================
    let strictSchedule = {
        "07:15": "ねむ～。忘れ物してない？\n財布、スマホ、鍵！ちゃんと確認してよね！",
        "07:45": "そろそろ家出る時間でしょ！？\nエアコン消した？！電気消した？！",
        "08:15": "もう電車の中？\n傘ちゃんともってってるよね？",
        "21:30": "ほら、もう21時半だよ！早くお風呂入ってよ！風呂キャン禁止！",
        "23:45": "夜更かし禁止！\nスマホ置いて早く寝ろーー！"
    };
    if (!isWeekend && strictSchedule[currentTimeString]) {
        taskTalkElement.textContent = strictSchedule[currentTimeString];
        return; 
    }

    let cachedWeather = JSON.parse(localStorage.getItem('cached_weather'));

    // ==========================================
    // 3.天気がON、かつ「朝7時台」のときだけ発動
    // ==========================================
    // 天気ボタンが'false' ではないとき（null または 'true' のとき）は true と判定する
    let isWeatherEnabled = localStorage.getItem('weather') !== 'false';

    if (isWeatherEnabled && currentHour === 7 && cachedWeather) {
        let weatherTalks = [];

        if (cachedWeather.status === "雨") {
            weatherTalks = [
                "おはよ！今日外は雨降るっぽいから傘絶対に持ってきなよー！☔",
                "最悪〜今日雨じゃん！お気に入りの靴濡らさないように気をつけてね？",
                "外、雨だよー。テンション下がるけど、可愛い傘持ってがんばろ！"
            ];
        } else if (cachedWeather.status === "晴れ") {
            weatherTalks = [
                "おはよー！外めっちゃいい天気だよ！☀️\n 今日もサクッと頑張ろ！",
                "めっちゃ晴れてるじゃん！最高〜！\n紫外線対策ちゃんとした？",
                "おはよ！今日天気いいから、なんか良いことありそうだね〜！"
            ];
        } else if (cachedWeather.status === "曇り") {
            weatherTalks = [
                "おはよ。今日の天気は曇り空っぽい感じ〜☁️ \n傘一応あると安心かも！",
                "なんかパッとしない天気だね〜。\nどんよりだけど元気出してこ！",
                "曇りだけど、過ごしやすい気温かも？\n今日もマイペースにいこー！"
            ];
        } else if (cachedWeather.status === "雪") {
            weatherTalks = [
                "おはよ！外めっちゃ雪降ってるよ！☃️ \n滑らないように気をつけて！",
                "え、雪じゃん！激寒なんだけど！\n超あったかくして出かけなよ？"
            ];
        }
    

        // セリフが設定されていれば、1時間固定の計算で選んで表示
        if (weatherTalks.length > 0) {
            // 今日の「年・月・日・時（7）」を合体させた数字を作る（通常セリフの計算と同じ）
            let weatherSeed = now.getFullYear() * 1000000 
                            + (now.getMonth() + 1) * 10000 
                            + now.getDate() * 100 
                            + currentHour;
            
            // 配列の長さで割った余りを使ってセリフを決定（1時間ずっと同じ数字になる）
            let weatherIndex = weatherSeed % weatherTalks.length; 
            
            taskTalkElement.textContent = weatherTalks[weatherIndex];
            return;
        }
    }

    // ==========================================
    // 4.自宅か外かで出し分けるリアルタイムおせっかい
    // ==========================================
    if (cachedWeather && (Date.now() - cachedWeather.updatedAt < 3600000) && !cachedWeather.isError) {
        //　30分表示するための計算
        let halfHourSlot = currentMinute >= 30 ? 1 : 0;
        let dateSeed = now.getFullYear() * 1000000 
                     + (now.getMonth() + 1) * 10000 
                     + now.getDate() * 100 
                     + (currentHour * 2 + halfHourSlot);

        if (cachedWeather.isHome) {
            //自宅にいるときのセリフ
            if (currentHour >= 19 && currentHour <= 20) {
                let homeTalks = [
                    "おかえりー！今日も一日お疲れ様。\n家着いたなら早く部屋着に着替えなよ〜？",
                    "お疲れ～超疲れたっしょ！\nゆっくり休みなよ～",
                    "今日も頑張ったじゃん！\n偉い偉い。早く手洗いとうがいしなよ？"
                ];
                let Index = dateSeed % homeTalks.length; 
                taskTalkElement.textContent = homeTalks[Index];
                return;
            }
        } else {
            // 自宅外のセリフ
            if (currentHour >= 11 && currentHour <= 13) {
                let outNoonTalks = [
                    "今外にいるんだ？ちゃんと鍵閉めてきた？",
                    "今日は何食べた？私ラーメン食べてきたよ～",
                    "外でお仕事中？お出かけ？\n水分補給ちゃんとしなよー！"
                ];
                let Index = dateSeed % outNoonTalks.length; 
                taskTalkElement.textContent = outNoonTalks[Index];
                return;
            }
            if (currentHour >= 22 || currentHour <= 1) {
                let outNightTalks = [
                    "ちょっと、もう夜遅いよ！？\nまだ外にいるの？早くお家に帰りなさい！",
                    "こんな時間まで何してるの？早く帰ってきな！",
                    "夜道危ないから気をつけてね？\n寄り道しないで真っ直ぐ帰るんだよー！"
                ];
                let Index = dateSeed % outNightTalks.length; 
                taskTalkElement.textContent = outNightTalks[Index];
                return;
            }
        }
    }

    // ==========================================
    // 5.時間帯の「幅」を持たせた通常おせっかい（固定表示）
    // ==========================================
    let weekdaySchedule = [
        { start: 5,  end: 6,  talks: ["おはよう！今日もお仕事だよね？\nがんばって～！", "ゆっくり休めた？", "ねむ～。忘れ物してない？財布とかスマホとか。\nちゃんと確認してよね～"] },
        { start: 7,  end: 8,  talks: ["家出る前にエアコン消したよね？！", "電気つけっぱにしてないよね？", "モバ充ちゃんと持ってる～？"] },
        { start: 9,  end: 11, talks: ["お仕事順調そう？がんばれー！！", "暇すぎるよ～早く帰ってきて！！", "お昼ちゃんと食べた～？ごはん食べないと午後きついぞ！"] },
        { start: 12, end: 16, talks: ["お昼休憩終わっちゃよ！\n午後もお仕事がんばれー！！", "そろそろ眠くなってくる時間じゃない？\nガムでも噛んで集中！", "お仕事終わらせて早く帰ってきてよね！！！", "おヤツの時間だけど、\nちゃんと集中してお仕事してる？", "夕方だ！\nあとちょっとでお仕事終わりかな？"] },
        { start: 17, end: 20, talks: ["もう外暗いよ。\n寄り道しないで早く帰ってきてね！", "夜ごはん食べた？\n食べないとだめだよ！", "あたし夜ごはんハンバーグだった！\nあなたもちゃんと食べなよ～", "食べた後皿洗った？\n放置したらダメだからね！"] },
        { start: 21, end: 22, talks: ["早くお風呂入ってよ～？\nさすがに入んないとやばいから！！！", "まさか風呂キャン…じゃないよね？"] },
        { start: 23, end: 4,  talks: ["スマホばっかやってないよね？早く寝ろ！！", "早く寝ないと健康に悪いぞー。\nもう夜中だよ！", "まだ起きてるの？！早く寝なさい！", "夜更かしは美容の敵！\n早くお布団に入って！", "おやすみ…", "早く寝て！"] }
    ];

    let weekendSchedule = [
        { start: 11, end: 12, talks: ["ちゃんと運動しないとだめだぞ～", "運動しないと太る！！！動け！！", "最近体重計乗った？自分磨してけ〜？"] },
        { start: 13, end: 17, talks: ["ちゃんと部屋掃除してる？やばいからね！？", "洗濯機回してる～？早く回しなよ～", "炊飯器放置してないよね？！", "冷蔵庫の物、腐らせたりしてないよね？！", "ゴミたまってない？\nちゃんとまとめて出しなよ！"] },
        { start: 18, end: 20, talks: ["夜ごはん食べた？食べないとだめだよ！", "あたし夜ごはんハンバーグだった！", "食べた後皿洗った？"] },
        { start: 21, end: 22, talks: ["早くお風呂入ってよ～？", "まさか風呂キャン…じゃないよね？"] },
        { start: 23, end: 10, talks: ["スマホばっかやってないよね？早く寝ろ！！", "早く寝ないと健康に悪いぞー", "夜更かししてないで明日のために寝よう！", "ベッドに入って目を閉じなよ～", "zzzZZZ…", "そろそろ朝になっちゃよ？"] }
    ];

    let scheduleList = isWeekend ? weekendSchedule : weekdaySchedule;
    let hourlyTalks = null;
    
    //　今の時間と一致する配列を探す
    for (let slot of scheduleList) {
        if (slot.start <= slot.end) {
            if (currentHour >= slot.start && currentHour <= slot.end) {
                hourlyTalks = slot.talks;
                break;
            }
        } else {
            if (currentHour >= slot.start || currentHour <= slot.end) {
                hourlyTalks = slot.talks;
                break;
            }
        }
    }
    //通常セリフを1時間固定で表示する
    if (hourlyTalks && hourlyTalks.length > 0) {
        let dateSeed = now.getFullYear() * 1000000 + (now.getMonth() + 1) * 10000 + now.getDate() * 100 + currentHour;
        let Index = dateSeed % hourlyTalks.length; 
        taskTalkElement.textContent = hourlyTalks[Index];
    } else {
        taskTalkElement.textContent = "zzZZZ...";
    }
}