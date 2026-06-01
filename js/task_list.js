function task_setting(){
    if (localStorage.getItem("breakfast") !== null) 
    {
        let breakfast = localStorage.getItem("breakfast");
        let a = "朝ごはん：" + breakfast;
        let b = "breakfast";            

        task_set_func(a, b);
    }
    else {
        let a = "朝ごはん：未設定";
        let b = "breakfast";
        task_set_func(a, b);
    }
    if (localStorage.getItem("dinner") !== null) 
    {
        let dinner = localStorage.getItem("dinner");
        let a = "夜ごはん：" + dinner; 
        let b = "dinner";            

        task_set_func(a, b);
    }
    else {
        let a = "夜ごはん：未設定";
        let b = "dinner";
        task_set_func(a, b);
    }
    if (localStorage.getItem("bath") !== null) 
    {
        let bath = localStorage.getItem("bath");
        let a = "お風呂：" + bath; 

        let b = "bath";             

        task_set_func(a, b);
    }
    else {
        let a = "お風呂：未設定";
        let b = "bath";
        task_set_func(a, b);
    }
    if (localStorage.getItem("weather") !== null) 
    {
        let bath = localStorage.getItem("wea");
        let a = "お風呂：" + bath; 

        let b = "bath";             

        task_set_func(a, b);
    }
    else {
        let a = "お風呂：未設定";
        let b = "bath";
        task_set_func(a, b);
    }
}

function task_set_func(a, b){
    let complete = document.getElementsByClassName("complete_task");
    let incomplete = document.getElementsByClassName("incomplete_task");

    let newElement = document.createElement('p');   
    newElement.textContent = a;
    newElement.className = "task_content";
    newElement.id = b;

    if (localStorage.getItem(b + "_task") === "true"){
        if (complete.length > 0) {
            complete[0].appendChild(newElement);
        }
    } else {
        if (incomplete.length > 0) {
            incomplete[0].appendChild(newElement);
        }
    }   
}   
  
window.onload = task_setting;
