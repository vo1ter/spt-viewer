function popualteProfiles(profiles) {
    let profilesContainer = document.querySelector(".profiles");

    for (const [key, value] of Object.entries(profiles)) {
        let date = new Date(value.PMCInfo.lastSession * 1000);
        let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"}); // convert date to string in local date format
        profilesContainer.innerHTML += `
            <div class="profile">
                <img draggable="false" class="user_img" src="./img/user.png" alt="" height="20px" width="20px">
                <div class="profile-info">
                Name: ${value.profileInfo.profileName} <br>
                ID: ${value.profileInfo.profileId} <br>
                Last Session: ${dateString}
                </div>
            </div>
        `
    }
}

fetch(`http://26.203.215.218:1337/profiles/get/everyone`, {
method: 'POST',
headers: {
    'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        
    })
})
.then(response => response.json())
.then(data => {
    popualteProfiles(data)
})
.catch(error => {
    console.error('Error:', error);
});


