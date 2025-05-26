class RESTnavigation {
    static navigations = {
        admin: [
            { LinkName: "Glasanja", link: "/" },
            { LinkName: "Upravljanje glasanjima", link: "/manage-voting" },
            { LinkName: "O nama", link: "/about-us" },
            { LinkName: "Politika privatnosti", link: "/privacy-policy" },
            { LinkName: "Profil", link: "/profile" },
            { LinkName: "Odjava", link: "/api/logout" }
        ],
        voter: [
            { LinkName: "Glasanja", link: "/" },
            { LinkName: "O nama", link: "/about-us" },
            { LinkName: "Politika privatnosti", link: "/privacy-policy" },
            { LinkName: "Profil", link: "/profile" },
            { LinkName: "Odjava", link: "/api/logout" }
        ],
        guest: [
            { LinkName: "Prijava", link: "/login" },
            { LinkName: "O nama", link: "/about-us" },
            { LinkName: "Politika privatnosti", link: "/privacy-policy" }
        ]
    };

    async getNavigaciju(req, res) {
        try {
            const type = req.session?.user?.type;
            let navigation;

            if (type == process.env.ADMINISTRATION_TYPE) {
                navigation = RESTnavigation.navigations.admin;
            } else if (type == process.env.REGULAR_TYPE) {
                navigation = RESTnavigation.navigations.voter;
            } else {
                navigation = RESTnavigation.navigations.guest;
            }

            res.status(200).json({ navigation });
        } catch (error) {
            console.error("Error getting navigation:", error);
            res.status(500).json({ Error: "Internal server error." });
        }
    }
}

module.exports = RESTnavigation;
