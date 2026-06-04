let task_content = localStorage.getItem("task_content") || "未選択";
let task_display = document.getElementById("now_task");

if (task_display) {
    task_display.textContent = task_content;
} else {
    console.error("now_taskというIDのタグが見つかりませんし！");
}


//完了したタスクの内容を読み取り、タスク内容_task = trueとかで格納する
function task_complete(){
    complete_task = document.getElementById("now_task").textContent;
    if(complete_task == "朝ごはん"){
        localStorage.setItem("breakfast_task", "true");
    }else if(complete_task == "夜ごはん"){
        localStorage.setItem("dinner_task", "true");
    }else if(complete_task == "お風呂"){
        localStorage.setItem("bath_task", "true");
    }
    window.location.href = "task_list.html"; 
}

function task_incomplete(){
    //タスクがまだできてなかったら、いったん5分後に通知を流すことにしたい！いずれ
    //とりあえずホームに移動させるだけ
    window.location.href = "index.html";
}