function popualteProfiles(profiles) {
    let profilesContainer = document.querySelector(".profiles");

    for (const [key, value] of Object.entries(profiles)) {
        profilesContainer.innerHTML += `Name: ${value.profileInfo.profileName} <br>`
    }
}

fetch('http://192.168.1.6:1337/profiles/get/everyone', {
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


