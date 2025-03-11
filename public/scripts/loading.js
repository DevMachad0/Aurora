document.addEventListener("DOMContentLoaded", () => {
    const loadingElement = document.createElement("div");
    loadingElement.id = "loading";
    loadingElement.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingElement);

    function showLoading() {
        loadingElement.style.display = "flex";
    }

    function hideLoading() {
        loadingElement.style.display = "none";
    }

    window.addEventListener("beforeunload", showLoading);
    window.addEventListener("load", hideLoading);
});
