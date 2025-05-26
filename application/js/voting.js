document.addEventListener("DOMContentLoaded", function() {
    getNavigation();

    async function getNavigation() {
        try {
            const response = await fetch('/api/navigation');
            const result = await response.json();
    
            if (response.ok && result.navigation) {
                const navElement = document.getElementById("nav");
                navElement.innerHTML = "";
    
                result.navigation.forEach(item => {
                    const link = document.createElement("a");
                    link.href = item.link;
                    link.textContent = item.LinkName;
    
                    if (item.LinkName === "Logout") {
                        link.id = "logout";
                        link.addEventListener("click", async (e) => {
                            e.preventDefault();
    
                            try {
                                const jwtRes = await fetch("/api/getJWT");
                                const jwtData = await jwtRes.json();
    
                                if (jwtRes.ok && jwtData.token) {
                                    const headers = new Headers();
                                    headers.append("Authorization", jwtData.token);
    
                                    const logoutRes = await fetch("/api/logout", {
                                        method: "GET",
                                        headers: headers
                                    });
    
                                    if (logoutRes.redirected) {
                                        window.location.href = logoutRes.url;
                                    } else {
                                        console.error("Logout failed.");
                                    }
                                } else {
                                    console.error("Failed to fetch JWT token.");
                                }
                            } catch (err) {
                                console.error("Logout error:", err);
                            }
                        });
                    }
    
                    navElement.appendChild(link);
                });
            }
        } catch (error) {
            console.error("Error getting navigation:", error);
        }
    }
    
});
document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    
    const jwtRes = await fetch("/api/getJWT");
    const jwtData = await jwtRes.json();

    if (!jwtRes.ok || !jwtData.token) {
        console.error("Failed to get JWT token.");
        return;
    }

    const res = await fetch(`/api/posts/${postId}`, {
        headers: {
            "Authorization": jwtData.token,
            "Accept": "application/json"
        }
    });


    const postData = await res.json();
    if (!res.ok) {
        console.error("Failed to load post data.");
        return;
    }

   
    const votingMain = document.getElementById("votingMain");
    votingMain.innerHTML = `<h2>${postData.name}</h2><p>${postData.description}</p>`;

  
    const choicesRes = await fetch(`/api/choices?postId=${postId}`, {
        headers: {
            "Authorization": jwtData.token,
            "Accept": "application/json"
        }
    });

    const choicesData = await choicesRes.json();
    if (!choicesRes.ok) {
        console.error("Failed to load choices.");
        return;
    }

  
    const form = document.createElement("form");
    choicesData.choices.forEach(choice => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "choice";
        input.value = choice.id;

        label.appendChild(input);
        label.appendChild(document.createTextNode(choice.name));
        form.appendChild(label);
        form.appendChild(document.createElement("br"));
    });

    const voteButton = document.createElement("button");
    voteButton.textContent = "Submit Vote";
    form.appendChild(voteButton);
   
    

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        const selectedChoice = form.querySelector('input[name="choice"]:checked');
        const messageDiv = document.createElement("div");
        messageDiv.style.marginTop = "10px";
    
        const oldMessage = form.querySelector(".vote-message");
        if (oldMessage) oldMessage.remove();
    
        messageDiv.classList.add("vote-message");
        form.appendChild(messageDiv);
    
        if (!selectedChoice) {
            messageDiv.textContent = "Molimo odaberite opciju prije glasanja.";
            messageDiv.style.color = "red";
            return;
        }
    
        try {
            const jwtRes = await fetch("/api/getJWT");
            const jwtData = await jwtRes.json();
    
            if (!jwtRes.ok || !jwtData.token) {
                messageDiv.textContent = "Greška pri autentifikaciji.";
                messageDiv.style.color = "red";
                return;
            }
    
            const hashRes = await fetch("/api/vote/hash", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": jwtData.token
                },
                body: JSON.stringify({
                    idVote: postData.id,
                    choiceId: selectedChoice.value
                })
            });
    
            const hashData = await hashRes.json();
            if (!hashRes.ok || !hashData.hash) {
                messageDiv.textContent = "Greška pri generiranju potpisa.";
                messageDiv.style.color = "red";
                return;
            }

    
            const voteRes = await fetch(`/api/submit-vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": jwtData.token
                },
                body: JSON.stringify({
                    postId: postData.id,
                    choiceId: selectedChoice.value,
                    signature: hashData.hash
                })
            });
    
            if (voteRes.ok) {
                messageDiv.textContent = "Uspješno ste glasali!";
                messageDiv.style.color = "green";
                voteButton.disabled = true;
    
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            } else if (voteRes.status === 409) {
                messageDiv.textContent = "Već ste glasali za ovaj post.";
                messageDiv.style.color = "orange";
            } else {
                const err = await voteRes.json();
                console.error("Greška pri glasanju:", err);
                messageDiv.textContent = "Došlo je do greške pri glasanju.";
                messageDiv.style.color = "red";
            }
    
        } catch (error) {
            console.error("Pogreška tijekom slanja glasa:", error);
            messageDiv.textContent = "Greška prilikom slanja glasa.";
            messageDiv.style.color = "red";
        }
    });    

    votingMain.appendChild(form);
});


