window.addEventListener('DOMContentLoaded', () => {
    set_now_task();
    let form = document.getElementById('input_form');
    let updateBtn = document.getElementById('updateBtn');
    let inputs = document.querySelectorAll('.input');

    let initialState = [];
    inputs.forEach((input, index) => {
        initialState[index] = input.type === 'checkbox' ? input.checked : input.value;
    });

    const checkChanges = () => {
        let hasChanged = false;

        inputs.forEach((input, index) => {
            const currentValue = input.type === 'checkbox' ? input.checked : input.value;
            

            if (currentValue !== initialState[index]) {
                hasChanged = true;
            }
        });

        updateBtn.style.display = hasChanged ? 'inline-block' : 'none';
    };

    form.addEventListener('input', checkChanges);
    form.addEventListener('change', checkChanges);
});

//ボタンを押したらローカルストレージに内容を保存する関数
let button = document.querySelector('#updateBtn');
button.addEventListener('click', () => {
    let breakfast = document.getElementById("breakfast").value;;
    localStorage.setItem('breakfast', breakfast);

    let dinner = document.getElementById("dinner").value;;
    localStorage.setItem('dinner', dinner);

    let bath = document.getElementById("bath").value;;
    localStorage.setItem('bath', bath);

    let weather = document.getElementById("weather").checked; 
    localStorage.setItem('weather', weather);

    let forget = document.getElementById("forget").checked; 
    localStorage.setItem('forget', forget);
});


//すでにセットされた設定を画面に反映させる最初の関数
function set_now_task(){
    let now_task_lst = ['breakfast', 'dinner', 'bath', 'weather', 'forget'];

    now_task_lst.forEach((key) => {
        let inputElement = document.getElementById(key);
        let savedValue = localStorage.getItem(key);

        if (inputElement && savedValue !== null) {
            
            if (inputElement.type === 'checkbox') {
                inputElement.checked = (savedValue === 'true');
            } else {
                inputElement.value = savedValue;
            } 
        }
    })
};