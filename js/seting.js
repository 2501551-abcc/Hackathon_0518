window.addEventListener('DOMContentLoaded', () => {
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


let button = document.querySelector('#updateBtn');
button.addEventListener('click', () => {
    localStorage.clear("breakfast", "diiner", "bath", "weather", "forget");
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


function set_now_task(){
    
}