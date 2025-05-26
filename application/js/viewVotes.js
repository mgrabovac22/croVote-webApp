document.addEventListener("DOMContentLoaded", function() {
    getNavigation();
    initPostView();

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
    async function initPostView() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('postId');

        const jwtRes = await fetch("/api/getJWT");
        const jwtData = await jwtRes.json();

        if (!jwtRes.ok || !jwtData.token) {
            console.error("Failed to get JWT token.");
            return;
        }

        const roleRes = await fetch("/api/user/role", {
            headers: {
                "Authorization": jwtData.token
            }
        });

        const roleData = await roleRes.json();

        const res = await fetch(`/api/posts/${postId}`, {
            headers: {
                "Authorization": jwtData.token,
                "Accept": "application/json"
            }
        });
        const postData = await res.json();
        if (!res.ok) {
            console.error("Failed to load view post data or it has been deleted.");
            return;
        }

        if (roleData === "Admin") {
            const viewMain = document.getElementById("viewMain");
            viewMain.innerHTML = `<h2>${postData.name}</h2><p>${postData.description}</p>`;

            const choicesRes = await fetch(`/api/choices?postId=${postId}`, {
                headers: {
                    "Authorization": jwtData.token,
                    "Accept": "application/json"
                }
            });

            if (!choicesRes.ok) {
                console.error("Failed to load choices.");
                return;
            }

            const statsRes = await fetch(`/api/stats?postId=${postId}`, {
                headers: {
                    "Authorization": jwtData.token,
                    "Accept": "application/json"
                }
            });
            const statsData = await statsRes.json();

            if (!statsRes.ok) {
                console.error("Failed to load vote statistics.");
                return;
            }

            const statsContainer = document.createElement("div");
            statsContainer.classList.add("stats-container");

            const statsTitle = document.createElement("h2");
            statsTitle.textContent = "Rezultati glasanja";
            statsContainer.appendChild(statsTitle);

            const statsDetails = document.createElement("div");
            statsDetails.classList.add("stats-details");

            statsData.stats.forEach(stat => {
                const p = document.createElement("p");
                p.innerHTML = `<strong>${stat.choiceName}:</strong> ${stat.voteCount} glasova (od ${stat.totalVotes})`;
                statsDetails.appendChild(p);
            });

            statsContainer.appendChild(statsDetails);
            viewMain.appendChild(statsContainer);
            const toggleBtn = document.createElement("button");
            toggleBtn.style.marginTop = "20px";
            toggleBtn.textContent = postData.isActive ? "Onemogući objavu" : "Omogući objavu";
            toggleBtn.classList.add("toggle-active-button");

            toggleBtn.addEventListener("click", async () => {
                const toggleRes = await fetch(`/api/posts/toggle${postId}`, {
                    method: "POST",
                    headers: {
                        "Authorization": jwtData.token
                    }
                });

                if (!toggleRes.ok) {
                    throw new Error("Error at toggle button.");
                } else {
                    postData.isActive = !postData.isActive;
                    toggleBtn.textContent = postData.isActive ? "Onemogući objavu" : "Omogući objavu";
                }
            });

            viewMain.appendChild(toggleBtn);
            
            const deleteBtn = document.createElement("button");

            deleteBtn.style.marginTop = "20px";
            deleteBtn.style.marginLeft = "10px";
            deleteBtn.textContent = "Obriši objavu";
            deleteBtn.classList.add("delete-button");

            deleteBtn.addEventListener("click", () => {
                const popup = document.getElementById("deletePopup");
                popup.style.display = "flex";
            
                const confirmBtn = document.getElementById("confirmDeleteBtn");
                const cancelBtn = document.getElementById("cancelDeleteBtn");
            
                const onConfirm = async () => {
                    const deleteRes = await fetch(`/api/posts-admin/${postId}`, {
                        method: "PUT",
                        headers: {
                            "Authorization": jwtData.token,
                            "Content-Type": "application/json"
                        }
                    });
            
                    if (!deleteRes.ok) {
                        console.error("Error at delete post.");
                        popup.style.display = "none";
                        return;
                    }
            
                    popup.style.display = "none";
                    window.location.href = "/manage-voting";
                };
            
                const onCancel = () => {
                    popup.style.display = "none";
                    confirmBtn.removeEventListener("click", onConfirm);
                    cancelBtn.removeEventListener("click", onCancel);
                };
            
                confirmBtn.addEventListener("click", onConfirm);
                cancelBtn.addEventListener("click", onCancel);
            });
            

            viewMain.appendChild(deleteBtn);

        }
        else {
            const viewMain = document.getElementById("viewMain");
            viewMain.innerHTML = `<h2>Poštovani naši</h2><p>Ovdje Vam nije dozvoljeno biti</p>`;
        }
    }
});