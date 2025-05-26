document.addEventListener("DOMContentLoaded", function() {
    getNavigation();

    const postsContainer = document.getElementById("posts-container");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");
    let currentPage = 1;
    let totalPages = 1;

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
    
    async function fetchPosts(page = 1) {
        const jwtRes = await fetch("/api/getJWT");
        const jwtData = await jwtRes.json();

        if (!jwtRes.ok || !jwtData.token) {
            throw new Error("Failed to get JWT");
        }

        const res = await fetch(`/api/posts-admin?page=${page}`, {
            headers: {
                "Authorization": jwtData.token
            }
        });
        
    
        const data = await res.json();
    
        if (!res.ok) {
            throw new Error(data.error || "Error fetching posts");
        }
    
        renderPosts(data.posts);
        currentPage = data.page;
        totalPages = data.totalPages;
        updatePagination();
        
    }
    
    function renderPosts(posts) {
        postsContainer.innerHTML = "";
    
        posts.forEach(post => {
            const tile = document.createElement("div");
            tile.className = "tile";
            
            if (post.isActive === 1) {
                tile.classList.add("active-post");
            } else {
                tile.classList.add("inactive-post");
            }

            const title = document.createElement("h2");
            title.textContent = post.name;

            if (post.isActive === 0) {
                const inactiveLabel = document.createElement("span");
                inactiveLabel.textContent = " (Neaktivno)";
                inactiveLabel.style.fontSize = "16px";
                title.appendChild(inactiveLabel);
            }
            
            title.addEventListener("click", () => {
                window.location.href = `/viewVotes?postId=${post.id}`;
            });

            const desc = document.createElement("p");
            desc.textContent = post.description;
    
            tile.appendChild(title);
            tile.appendChild(desc);
    
            postsContainer.appendChild(tile);
        });
    }
    
    function updatePagination() {
        if(totalPages === 0){
            totalPages = 1;
        }
        pageInfo.textContent = `Page ${currentPage} od ${totalPages}`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) fetchPosts(currentPage - 1);
    });
    
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) fetchPosts(currentPage + 1);
    });
    
    fetchPosts();
    
    const addPostBtn = document.getElementById("addPostBtn");
    const newPostForm = document.getElementById("newPostForm");
    const choicesContainer = document.getElementById("choicesContainer");
    const addChoiceBtn = document.getElementById("addChoiceBtn");

    addPostBtn.addEventListener("click", () => {
        const isHidden = newPostForm.style.display === "none" || newPostForm.style.display === "";
        newPostForm.style.display = isHidden ? "flex" : "none";
        addPostBtn.textContent = isHidden ? "Sakrij" : "Nova objava";
    });
    

    addChoiceBtn.addEventListener("click", () => {
        const index = choicesContainer.querySelectorAll(".choice-input").length + 1;
    
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "10px";
        wrapper.style.marginBottom = "5px";
    
        const newChoice = document.createElement("input");
        newChoice.type = "text";
        newChoice.classList.add("choice-input");
        newChoice.placeholder = `Odabir ${index}`;
        newChoice.style.flex = "1";
    
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "✖";
        removeBtn.title = "Ukloni odabir";
        removeBtn.style.background = "transparent";
        removeBtn.style.border = "none";
        removeBtn.style.color = "#dc3545";
        removeBtn.style.fontSize = "18px";
        removeBtn.style.cursor = "pointer";
    
        removeBtn.addEventListener("click", () => {
            wrapper.remove();
            updateChoicePlaceholders();
        });
    
        wrapper.appendChild(newChoice);
        wrapper.appendChild(removeBtn);
    
        choicesContainer.appendChild(wrapper);
    
        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error-message", "choice-error");
        choicesContainer.appendChild(errorDiv);
    });
    

    newPostForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("postName");
        const descInput = document.getElementById("postDescription");
        const nameError = document.getElementById("postNameError");
        const descError = document.getElementById("postDescriptionError");
        const choiceErrors = choicesContainer.querySelectorAll(".choice-error");

        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const choiceInputs = choicesContainer.querySelectorAll(".choice-input");

        nameInput.classList.remove("input-error");
        descInput.classList.remove("input-error");
        choiceInputs.forEach(input => input.classList.remove("input-error"));
        nameError.textContent = "";
        descError.textContent = "";
        choiceErrors.forEach(errDiv => errDiv.textContent = "");

        let hasError = false;

        if (!name) {
            nameInput.classList.add("input-error");
            nameError.textContent = "Naslov je obavezan.";
            hasError = true;
        } else if (name.length > 100) {
            nameInput.classList.add("input-error");
            nameError.textContent = "Naslov može imati najviše 100 znakova.";
            hasError = true;
        }

        if (!description) {
            descInput.classList.add("input-error");
            descError.textContent = "Opis je obavezan.";
            hasError = true;
        } else if (description.length > 1000) {
            descInput.classList.add("input-error");
            descError.textContent = "Opis može imati najviše 1000 znakova.";
            hasError = true;
        }

        const choices = [];

        choiceInputs.forEach((input, idx) => {
            const val = input.value.trim();
            const errorDiv = choiceErrors[idx];
            if (!val) {
                input.classList.add("input-error");
                errorDiv.textContent = "Odabir ne može biti prazan.";
                hasError = true;
            } else if (val.length >= 45) {
                input.classList.add("input-error");
                errorDiv.textContent = "Odabir može imati najviše 44 znaka.";
                hasError = true;
            } else {
                choices.push(val);
            }
        });

        if (hasError) return;

        const jwtRes = await fetch("/api/getJWT");
        const jwtData = await jwtRes.json();

        if (!jwtRes.ok || !jwtData.token) {
            throw new Error("Failed to get JWT");
        }

        const res = await fetch("/api/posts/new-post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": jwtData.token
            },
            body: JSON.stringify({ name, description })
        });
        
        if (!res.ok) return;

        const post = await res.json();

        await Promise.all(choices.map(choiceName =>
            fetch("/api/posts/new-choice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": jwtData.token
                },
                body: JSON.stringify({ name: choiceName, post_id: post.id })
            })
        ));
        

        newPostForm.reset();
        choicesContainer.innerHTML = `
            <input type="text" class="choice-input" placeholder="Odabir 1">
            <input type="text" class="choice-input" placeholder="Odabir 2">
        `;
        newPostForm.style.display = "none";
        fetchPosts();
    });
});



