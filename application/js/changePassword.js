document.addEventListener("DOMContentLoaded", function() {
    getNavigation();

    const form = document.getElementById("changePasswordForm");
    const lblError = document.getElementById("lblError");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        lblError.textContent = "";

        const oib = form.oib.value.trim();
        const email = form.email.value.trim();
        const oldPassword = form.oldPassword.value.trim();
        const newPassword = form.newPassword.value.trim();
        const confirmPassword = form.confirmPassword.value.trim();

        function validateOIB(oib) {
            if (!/^\d{11}$/.test(oib)) return false;
        
            let a = 10;
            for (let i = 0; i < 10; i++) {
                a = (parseInt(oib[i], 10) + a) % 10;
                if (a === 0) a = 10;
                a = (a * 2) % 11;
            }
            let controlDigit = (11 - a) % 10;
            return controlDigit === parseInt(oib[10], 10);
        }
        
        if (!validateOIB(oib)) {
            lblError.textContent = "OIB nije valjan.";
            return;
        }  

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            lblError.textContent = "Unesite ispravan email.";
            return;
        }

        if (newPassword.length < 6) {
            lblError.textContent = "Nova lozinka mora imati najmanje 6 znakova.";
            return;
        }

        if (newPassword !== confirmPassword) {
            lblError.textContent = "Lozinke se ne podudaraju.";
            return;
        }

        if (oldPassword === newPassword) {
            lblError.textContent = "Nova lozinka mora biti različita od stare.";
            return;
        }

        try {
            const response = await fetch("/api/changing-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    oib,
                    email,
                    password: newPassword,
                    oldPassword
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showModal("Lozinka je uspješno promijenjena.");
                form.reset();
            } else {
                lblError.textContent = result.error || "Došlo je do greške.";
            }              
        } catch (error) {
            console.error("Greška:", error);
            lblError.textContent = "Greška u komunikaciji sa serverom.";
        }
    });

    function showModal(message) {
        const modal = document.getElementById("feedbackModal");
        const modalMessage = document.getElementById("modalMessage");
        modalMessage.textContent = message;
        modal.style.display = "block";
    }
    
    function closeModal() {
        const modal = document.getElementById("feedbackModal");
        modal.style.display = "none";
    }
    
    const closeBtn = document.getElementById("closeModal");
    closeBtn.addEventListener("click", closeModal);

    window.addEventListener("click", function(event) {
    const modal = document.getElementById("feedbackModal");
    if (event.target === modal) {
        closeModal();
    }
    });
  
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

