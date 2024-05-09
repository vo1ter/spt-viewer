//Constatnts
let gameTimeContainer = ""
const tarkovRatio = 7;
const updateRate = 1000 / tarkovRatio;

// Font change
function changeFont() {
    document.body.classList.toggle('funny-fontXD');
}

// In game time
async function updateTime() {
    while (true) {
        let tarkovTimeDay = realTimeToTarkovTime(new Date(), false);
        let tarkovTimeNight = realTimeToTarkovTime(new Date(), true);
        let iconTimeDay = "";
        let iconTimeNight = ""

        if(parseInt((tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' })).split(":")[0]) >= 5) {
            iconTimeNight = "./img/day.png";
            iconTimeDay = "./img/night.png";
        }
        else if(parseInt((tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' })).split(":")[0]) < 5) {
            iconTimeNight = "./img/night.png";
            iconTimeDay = "./img/day.png";
        }


        gameTimeContainer.innerHTML = `
            <img draggable="false" class="icon" src="${iconTimeDay}" alt=""> 
                ${tarkovTimeNight.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' })} | 
            <img draggable="false" class="icon" src="${iconTimeNight}" alt=""> 
                ${tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' })}`;
        await new Promise(resolve => setTimeout(resolve, updateRate));
    }
}

function hrs(num) {
    return 1000 * 60 * 60 * num;
}

function realTimeToTarkovTime(time, left) {
    const oneDay = hrs(24);
    const russia = hrs(2);

    const offset = russia + (left ? 0 : hrs(12));
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

function formatNumber(num) {
    if (num < 0) return num.toString();
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Footer
(() => {
    document.getElementsByTagName("body")[0].innerHTML = `
    <header>
        <a href="index.html"><h1>Profile Cards</h1></a>
        <div class="game-time"></div>
    </header>
    ${document.getElementsByTagName("body")[0].innerHTML}
    <footer>
        <em>
            &copy; 2024 <a href="https://vo1ter.me">vo1ter.me</a> and <a href="https://github.com/AndreyKarm">AndreyKarm</a>
            <br><a onclick="changeFont()" class="secret">Secret</a>
        </em>
    </footer>`
    gameTimeContainer = document.querySelector(".game-time");
    updateTime()
})();