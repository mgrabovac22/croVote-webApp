document.addEventListener("DOMContentLoaded", function () {
    getNavigation();

    const form = document.querySelector("form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
    
        const oib = form.querySelector("input[name='oib']").value.trim();
        const password = form.querySelector("input[name='password']").value.trim();

        const recaptchaToken = await grecaptcha.execute(
            "6LfW5DUrAAAAAAcgKVIkI2DCgzeHVZwlPoe9Eu0e",
            { action: "login" }
        );

        document.getElementById("recaptcha-token").value = recaptchaToken;
        
    
        await submitForm(oib, password, recaptchaToken);
    });    

    function showTotpModal() {
        const modal = document.getElementById("totpModal");
        modal.classList.add("show");
        totpInputs[0].focus();
    }    

    function hideTotpModal() {
        const modal = document.getElementById("totpModal");
        modal.classList.remove("show");
    }    

    document.getElementById("closeTotp").addEventListener("click", hideTotpModal);

    window.addEventListener("click", function (event) {
        const modal = document.getElementById("totpModal");
        if (event.target === modal) {
            hideTotpModal();
        }
    });

    const totpInputs = document.querySelectorAll('.totp-input');

    totpInputs.forEach((input, index) => {
        input.addEventListener('input', function () {
            if (this.value.length === 1 && index < totpInputs.length - 1) {
                totpInputs[index + 1].focus();
            }

            const totpCode = Array.from(totpInputs).map(input => input.value.trim()).join('');
            if (totpCode.length === 6) {
                handleTotpSubmit(totpCode);
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                totpInputs[index - 1].focus();
            }
        });
    });

    function resetOtpFields() {
        totpInputs.forEach(input => input.value = '');
        totpInputs[0].focus();
    }    

    async function handleTotpSubmit(totpCode) {
        const oib = document.querySelector("input[name='oib']").value.trim();
        const totpError = document.getElementById('totpError');

        if (!/^\d{6}$/.test(totpCode)) {
            totpError.innerText = "Unesite ispravan 6-znamenkasti kod.";
            return;
        }

        try {
            const response = await fetch("/api/verify-totp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oib, token: totpCode })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                window.location.href = "/";
            } else {
                totpError.innerText = "Neispravan TOTP kod.";
                animateOtpFields();
                resetOtpFields();
            }
        } catch (error) {
            console.error("Greška prilikom provjere TOTP-a:", error);
            totpError.innerText = "Greška u komunikaciji sa serverom.";
            resetOtpFields();
        }
    }

    function animateOtpFields() {
        const totpInputs = document.querySelectorAll('.totp-input');
        totpInputs.forEach((input, index) => {
            input.animate([
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' }
            ], {
                duration: 500,
                delay: index * 100,
                iterations: 1
            });
        });
    }

    async function submitForm(oib, password, recaptchaToken) {
        const lblError = document.getElementById("lblError");
        lblError.innerHTML = "";
    
        try {
            const lockCheck = await fetch('/api/login-tries');            
            const lockData = await lockCheck.json();            
        
            if (lockData.attemptsLeft === 0) {
                const mins = Math.ceil(lockData.retryAfter / 60);
                lblError.innerHTML = `Previše pokušaja. Pokušaj ponovno za ${mins} min.`;
                return;
            }
        } catch (e) {
            console.error("Greška kod provjere pokušaja:", e);
        }        
    
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
    
        if (password.length < 6) {
            lblError.innerHTML = "Lozinka mora imati najmanje 6 znakova.";
            return;
        }
    
        const data = { oib, password, recaptchaToken };
    
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
    
            if (response.status === 429) {
                const result = await response.json();
                const mins = Math.ceil(result.retryAfter / 60);
                lblError.textContent = `Previše pokušaja. Pokušajte ponovno za ${mins} min.`;
                return;
            }            

            const result = await response.json();

            if (!response.ok && result.error) {
                if (result.attemptsLeft !== undefined) {
                    if (result.attemptsLeft === 0) {
                        const mins = Math.ceil(result.retryAfter / 60);
                        lblError.innerHTML = `Previše pokušaja. Pokušaj ponovno za ${mins} min.`;
                    } else {
                        lblError.innerHTML = `Neispravan OIB ili lozinka. Preostalo pokušaja: ${result.attemptsLeft}`;
                    }
                } else {
                    lblError.innerHTML = "Neispravan OIB ili lozinka.";
                }
                return;
            }            

            if (response.ok && result.success === "Login successful!") {
                window.location.href = "/";
            } else if (response.ok && result.requiresTOTP) {
                showTotpModal();
            } else {
                lblError.innerHTML = "Neispravan OIB ili lozinka.";
            }
        } catch (error) {
            console.error('Error:', error);
            lblError.innerHTML = "Greška u komunikaciji sa serverom.";
        }
    }    

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
