let gameTimeContainer = ""
const tarkovRatio = 7;
const updateRate = 1000 / tarkovRatio;

function changeFont() {
    document.body.classList.toggle('funny-fontXD');
}

async function updateTime() {
    while (true) {
        let date = new Date();
        let tarkovTimeDay = realTimeToTarkovTime(date, false);
        let tarkovTimeNight = realTimeToTarkovTime(date, true);
        let firstTimeIcon = ""
        let secondTimeIcon = ""

        if(tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' }).split(":")[0] > 20 && tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' }).split(":")[0] < 12) {
            firstTimeIcon = "./img/night.png";
            secondTimeIcon = "./img/day.png";
        }
        else if(tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' }).split(":")[0] < 20 && tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' }).split(":")[0] > 5) {
            firstTimeIcon = "./img/day.png";
            secondTimeIcon = "./img/night.png";
        }

        gameTimeContainer.innerHTML = `
            <img draggable="false" class="icon" src="${firstTimeIcon}" alt=""> 
                ${tarkovTimeDay.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' })} | 
            <img draggable="false" class="icon" src="${secondTimeIcon}" alt=""> 
                ${tarkovTimeNight.toLocaleTimeString("en-GB", { timeZone: "Europe/London" }, { hour: '2-digit', minute: '2-digit' })}`;
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