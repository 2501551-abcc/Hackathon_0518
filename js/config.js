'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    let saveHomeBtn = document.getElementById('save_home_btn');
    let toggleWeather = document.getElementById('toggle_weather');
    
    // 1. 各タイマーの変更時に自動保存（空欄時は自動削除）
    setupTaskEvent('time_sleep', '睡眠');
    setupTaskEvent('time_exercise', '運動');
    setupTaskEvent('time_cooking', '料理');

    // 2. 天気トグルボタンの初期ロードとイベント連動
    if (toggleWeather) {
        // 保存されている設定を反映（未設定ならデフォルトtrue）
        let isWeatherEnabled = localStorage.getItem('toggle_weather') !== 'false';
        toggleWeather.checked = isWeatherEnabled;
        
        // 切り替え時にLocalStorageへ保存
        toggleWeather.addEventListener('change', () => {
            localStorage.setItem('toggle_weather', toggleWeather.checked);
        });
    }

    // 3. 初期表示時のロード
    Load_settings();
    await check_location_on_load();

    // 自宅保存ボタンのイベント
    if (saveHomeBtn) {
        saveHomeBtn.addEventListener('click', Register_home);
    }
});

// input type="time" の値が変わったら保存・削除する関数
function setupTaskEvent(elementId, genre) {
    let element = document.getElementById(elementId);
    if (!element) return;

    element.addEventListener('change', () => {
        let savedTasks = JSON.parse(localStorage.getItem('user_tasks')) || {};
        
        // 重複防止＆削除対応：既存の同じジャンルの古い時間を一度すべて消す
        for (let time in savedTasks) {
            if (savedTasks[time] === genre) {
                delete savedTasks[time];
            }
        }

        // 値が入力されている場合のみ、新しい時間をキーにして保存
        if (element.value) {
            savedTasks[element.value] = genre;
        }
        
        localStorage.setItem('user_tasks', JSON.stringify(savedTasks));
    });
}

//ローカルにあるデータをinputや現在の自宅設定に反映させる関数
function Load_settings() {
    let currentHomeText = document.getElementById('current_home_text');
    let savedTasks = JSON.parse(localStorage.getItem('user_tasks')) || {};
    
    // 保存されているタスクを input type="time" に復元
    for (let time in savedTasks) {
        let genre = savedTasks[time];
        if (genre === "睡眠") {
            let el = document.getElementById('time_sleep');
            if (el) el.value = time;
        } else if (genre === "運動") {
            let el = document.getElementById('time_exercise');
            if (el) el.value = time;
        } else if (genre === "料理") {
            let el = document.getElementById('time_cooking');
            if (el) el.value = time;
        }
    }

    // 自宅設定の表示
    if (currentHomeText) {
        let savedHome = JSON.parse(localStorage.getItem('user_home'));
        if (savedHome && savedHome.lat && savedHome.lon) {
            currentHomeText.textContent = `自宅設定：登録済み (緯度:${parseFloat(savedHome.lat).toFixed(2)}, 経度:${parseFloat(savedHome.lon).toFixed(2)})`;
        } else {
            currentHomeText.textContent = "自宅設定：未登録(自動的に東京が設定されます。)";
        }
    }
}

async function check_location_on_load() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (position) => { Remove_error(); },
        (error) => { Display_error(error); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

//自宅位置を保存する関数
function Register_home() {
    if (!navigator.geolocation) {
        alert("このブラウザは位置情報に対応していません。");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            Remove_error();
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            
            let homeInfo = { lat: lat, lon: lon };
            localStorage.setItem('user_home', JSON.stringify(homeInfo));
            
            let currentHomeText = document.getElementById('current_home_text');
            if (currentHomeText) {
                currentHomeText.textContent = `自宅設定：登録済み (緯度:${lat.toFixed(2)}, 経度:${lon.toFixed(2)})`;
            }
            alert("現在地を自宅として登録したよ！変更は次回起動時から反映されるよ。");
        },
        (error) => {
            Display_error(error);
            alert("位置情報の取得に失敗したため、自宅登録ができなかったよ。設定を確認してね。");
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
    localStorage.removeItem('cached_weather');

}

// エラーを表示する関数
function Display_error(error) {
    let messageBox = document.getElementById('setting_error_area');
    if (!messageBox) return;

    Remove_error();

    let errorDiv = document.createElement('div');
    errorDiv.id = 'location_error_notice';
    errorDiv.style.cssText = `
        background-color: #fff0f3;
        border: 2px dashed #ff4a79;
        border-radius: 8px;
        padding: 15px;
        margin: 10px auto 20px auto;
        width: 90%;
        font-size: 0.9em;
        color: #d61c4e;
        line-height: 1.4;
        box-sizing: border-box;
    `;

    if (error.code === error.PERMISSION_DENIED) {
        errorDiv.innerHTML = "❌ <b>位置情報がブロックされています</b><br>スマホの設定やブラウザの設定から、位置情報のアクセスを『許可』にしてからもう一度試してね！";
    } else if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
        errorDiv.innerHTML = "❌ <b>位置情報の取得に失敗しました</b><br>GPSがONになっているか、電波が良い場所でもう一度試してね！";
    } else {
        errorDiv.innerHTML = `❌ <b>位置情報エラー (コード: ${error.code})</b>`;
    }

    let retryBtn = document.createElement('button');
    retryBtn.textContent = "再チェックする";
    retryBtn.style.cssText = `
        display: block;
        margin: 10px auto 0 auto;
        padding: 6px 16px;
        background-color: #ff4a79;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.9em;
        font-weight: bold;
        cursor: pointer;
    `;
    retryBtn.onclick = () => {  window.location.reload(); };

    errorDiv.appendChild(retryBtn);
    messageBox.appendChild(errorDiv);
}

function Remove_error() {
    let existingError = document.getElementById('location_error_notice');
    if (existingError) {
        existingError.remove();
    }
}