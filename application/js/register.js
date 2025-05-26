document.addEventListener("DOMContentLoaded", function() {
    getNavigation();
    const form = document.querySelector("form");

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const lblError = document.getElementById("lblError");
        lblError.innerHTML = "";

        const oib = form.querySelector("input[name='oib']").value.trim();
        const name = form.querySelector("input[name='name']").value.trim();
        const surname = form.querySelector("input[name='surname']").value.trim();
        const address = form.querySelector("input[name='address']").value.trim();
        const phone = form.querySelector("input[name='phone']").value.trim();
        const email = form.querySelector("input[name='email']").value.trim();
        const password = form.querySelector("input[name='password']").value.trim();
        const confirm = form.querySelector("input[name='confirm-password']").value.trim();

        const recaptchaToken = await grecaptcha.execute(
            "6LfW5DUrAAAAAAcgKVIkI2DCgzeHVZwlPoe9Eu0e",
            { action: "login" }
        );

        document.getElementById("recaptcha-token").value = recaptchaToken;

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
            lblError.innerHTML = "OIB nije valjan.";
            return;
        }        
        if (name.length === 0) {
            lblError.innerHTML = "Ime je obavezno.";
            return;
        }
        if (surname.length === 0) {
            lblError.innerHTML = "Prezime je obavezno.";
            return;
        }
        if (address.length === 0) {
            lblError.innerHTML = "Adresa je obavezna.";
            return;
        }
        if (!/^\d{6,}$/.test(phone)) {
            lblError.innerHTML = "Broj telefona mora sadržavati minimalno 6 znamenki.";
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            lblError.innerHTML = "Unesite ispravnu email adresu.";
            return;
        }
        if (password.length < 6) {
            lblError.innerHTML = "Lozinka mora imati najmanje 6 znakova.";
            return;
        }
        if (password !== confirm) {
            event.preventDefault();
            lblError.innerHTML = 'Lozinke se ne podudaraju.';
            return;
        }

        const data = {
            oib,
            name,
            surname,
            address,
            phone,
            email,
            password,
            recaptchaToken
        };

        try {
            const response = await fetch('/api/check-existing-oib', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oib })
            });

            if (!response.ok) {
                lblError.innerHTML = "Korisnik sa tim OIB-om je već registriran!";
                event.preventDefault();
                return;
            }
        } catch (error) {
            console.error('Error:', error);
            lblError.innerHTML = "Greška u komunikaciji sa serverom.";
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                window.location.href = "/login";
            } else {
                lblError.innerHTML = "Došlo je do pogreške pri registraciji!";
            }
        } catch (error) {
            console.error('Error:', error);
            lblError.innerHTML = "Greška u komunikaciji sa serverom.";
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
