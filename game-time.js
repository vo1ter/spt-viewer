// 1 second real time = 7 seconds tarkov time
const tarkovRatio = 7;
const erroffset = hrs(1);
const updateRate = 1000;
let gameTimeContainer = document.querySelector(".game-time");

console.log("Game Time Script Loaded");
async function updateTime() {
    while (true) {
        let date = new Date();
        let tarkovTimeDay = realTimeToTarkovTime(date, false);
        let tarkovTimeNight = realTimeToTarkovTime(date, true);
        gameTimeContainer.innerHTML = `
            <img draggable="false" class="icon" src="./img/day.png" alt=""> 
                ${tarkovTimeDay.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | 
            <img draggable="false" class="icon" src="./img/night.png" alt=""> 
                ${tarkovTimeNight.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        await new Promise(resolve => setTimeout(resolve, updateRate));
    }
}

function hrs(num) {
    return 1000 * 60 * 60 * num;
}

function realTimeToTarkovTime(time, left) {
    const oneDay = hrs(24);
    const russia = hrs(3);

    const offset = russia - erroffset + (left ? 0 : hrs(12));
    const tarkovTime = new Date((offset + (time.getTime() * tarkovRatio)) % oneDay);
    return tarkovTime;
}

function timeUntilRelative(until, left, date) {
    const tarkovTime = realTimeToTarkovTime(date, left);
    if (until < tarkovTime.getTime()) until += hrs(24);

    const diffTarkov = until - tarkovTime.getTime();
    const diffRT = diffTarkov / tarkovRatio;

    return diffRT;
}

updateTime();