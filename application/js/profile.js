document.addEventListener("DOMContentLoaded", function() {
    getNavigation();
    getProfileData();

    async function getProfileData() {
        try {

            const jwtRes = await fetch("/api/getJWT");
            const jwtData = await jwtRes.json();

            if (jwtRes.ok && jwtData.token) {
                const headers = new Headers();
                headers.append("Authorization", jwtData.token);

                const res = await fetch("/api/current-user", {
                    method: "GET",
                    headers: headers
                });

                const data = await res.json();
    
                if (res.ok) {
                    document.getElementById("profile-oib").textContent = data.oib;
                    document.getElementById("profile-name").textContent = data.name;
                    document.getElementById("profile-surname").textContent = data.surname;
                    document.getElementById("profile-email").textContent = data.email;
                    document.getElementById("profile-type").textContent = data.type;

                    checkTotpStatus(data.oib);
    
                    document.getElementById('enable-totp-button').addEventListener('click', () => {
                        enableTotp(data.oib);
                    });
                } else {
                    console.error("Failed to load profile.");
                }
            } else {
                console.error("Failed to fetch JWT token.");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }

    async function checkTotpStatus(oib) {
        const jwtRes = await fetch("/api/getJWT");
        const jwtData = await jwtRes.json();
    
        const headers = new Headers();
        headers.append("Authorization", jwtData.token);
    
        const res = await fetch(`/api/user/totp/enabled/${oib}`, {
            headers: headers
        });
        const data = await res.json();
    
        const enableBtn = document.getElementById('enable-totp-button');
        const disableBtn = document.getElementById('disable-totp-button');
        const statusEl = document.getElementById("totp-status");
        
        statusEl.textContent = data.TOTP_enabled === 1 ? "TOTP je omogućen." : "TOTP nije omogućen.";

    
        if (data.TOTP_enabled === 1) {
            disableBtn.style.display = 'block';
            enableBtn.style.display = 'none';
        } else {
            enableBtn.style.display = 'block';
            disableBtn.style.display = 'none';
        }
    
        disableBtn.addEventListener('click', () => {
            disableTotp(oib);
        });
    }
    
    async function enableTotp(oib) {
        const jwtRes = await fetch("/api/getJWT");
        const jwtData = await jwtRes.json();
    
        const headers = new Headers();
        headers.append("Authorization", jwtData.token);
    
        const res = await fetch(`/api/user/totp/enable/${oib}`, {
            method: 'POST',
            headers: headers
        });
    
        const data = await res.json();
    
        if (res.ok) {
            document.getElementById('totp-info').style.display = 'block';
            document.getElementById('totp-secret').textContent = data.secret;
            document.getElementById('totp-qr').src = data.qrCode;
    
            document.getElementById('enable-totp-button').style.display = 'none';
            document.getElementById('disable-totp-button').style.display = 'block';

            checkTotpStatus(oib);
        }
    }
    
    async function disableTotp(oib) {
        const jwtRes = await fetch("/api/getJWT");
        const jwtData = await jwtRes.json();
    
        const headers = new Headers();
        headers.append("Authorization", jwtData.token);
    
        const res = await fetch(`/api/user/totp/disable/${oib}`, {
            method: 'POST',
            headers: headers
        });
    
        if (res.ok) {
            document.getElementById('disable-totp-button').style.display = 'none';
            document.getElementById('enable-totp-button').style.display = 'block';
            document.getElementById('totp-info').style.display = 'none';

            checkTotpStatus(oib);
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

