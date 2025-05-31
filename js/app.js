// Configuration for API endpoints
const API_CONFIG = {
    NGROK_URL: 'https://857949f11264.ngrok.app',
    HEADERS: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    }
};

// Function to get the current API base URL
const getApiBaseUrl = () => {
    return API_CONFIG.NGROK_URL;
};

// Function to make API requests with proper headers
const makeApiRequest = async (url, options = {}) => {
    const defaultOptions = {
        headers: {
            ...API_CONFIG.HEADERS,
            ...options.headers
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
};

// URL Parameter Management
class URLParameterManager {
    constructor() {
        this.currentParams = this.getURLParams();
        this.initializeFromURL();
    }

    // Get URL parameters from current URL
    getURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            uwi: urlParams.get('uwi') || 'PEB000026D1',
            top_md: urlParams.get('top_md') ? parseInt(urlParams.get('top_md')) : null,
            bot_md: urlParams.get('bot_md') ? parseInt(urlParams.get('bot_md')) : null,
            icon_name: urlParams.get('icon_name') || ''
        };
    }

    // Update URL parameters without page reload
    updateURLParams(newParams) {
        this.currentParams = { ...this.currentParams, ...newParams };
        
        // Remove null/undefined/empty values
        const cleanParams = {};
        Object.keys(this.currentParams).forEach(key => {
            if (this.currentParams[key] !== null && this.currentParams[key] !== undefined && this.currentParams[key] !== '') {
                cleanParams[key] = this.currentParams[key];
            }
        });

        const urlParams = new URLSearchParams(cleanParams);
        const newURL = `${window.location.pathname}?${urlParams.toString()}`;
        
        // Update URL without page reload
        window.history.pushState({ path: newURL }, '', newURL);
        
        console.log('🔗 URL updated:', newURL);
        console.log('📊 Current parameters:', this.currentParams);
    }

    // Initialize form fields from URL parameters
    initializeFromURL() {
        // Set form values from URL parameters when DOM is ready
        setTimeout(() => {
            const topMdInput = document.getElementById("filterTopMd");
            const botMdInput = document.getElementById("filterBotMd");
            const iconNameInput = document.getElementById("filterIconName");

            if (topMdInput && this.currentParams.top_md) {
                topMdInput.value = this.currentParams.top_md;
            }
            if (botMdInput && this.currentParams.bot_md) {
                botMdInput.value = this.currentParams.bot_md;
            }
            if (iconNameInput && this.currentParams.icon_name) {
                iconNameInput.value = this.currentParams.icon_name;
            }

            console.log('🎯 Initialized from URL:', this.currentParams);
        }, 100);
    }

    // Get current parameters for API requests
    getAPIParams() {
        return this.currentParams;
    }
}

// Initialize URL parameter manager
const urlManager = new URLParameterManager();

// Pastikan elemen tooltip dibuat di awal
let tooltip = document.getElementById("tooltip");
if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
}

function showTooltip(event, text) {
    tooltip.innerHTML = text;
    tooltip.style.display = "block";

    let x = event.pageX || (event.touches && event.touches[0].clientX) || event.clientX;
    let y = event.pageY || (event.touches && event.touches[0].clientY) || event.clientY;

    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
}

function hideTooltip() {
    tooltip.style.display = "none";
}

function renderRemarksWithTooltip() {
    const remarks = document.querySelectorAll(".remarks");

    remarks.forEach(remark => {
        remark.addEventListener("mouseover", (e) => {
            showTooltip(e, remark.dataset.text);
        });

        remark.addEventListener("mousemove", (e) => showTooltip(e, remark.dataset.text));
        remark.addEventListener("mouseout", hideTooltip);

        remark.addEventListener("touchstart", (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            showTooltip(touch, remark.dataset.text);
        });

        remark.addEventListener("touchend", hideTooltip);
    });
}

function updateRemarksTooltip() {
    setTimeout(renderRemarksWithTooltip, 500);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 DOM telah dimuat, inisialisasi aplikasi...");
    console.log("🌐 API Base URL:", getApiBaseUrl());

    // Initialize form event listeners after DOM is loaded
    initializeFormListeners();
    
    // Load initial data based on URL parameters
    fetchWellboreData();

    window.addEventListener("resize", () => {
        console.log("🔄 Layar berubah, memperbarui diagram...");
        renderDiagram();
    });
});

// Initialize form event listeners
function initializeFormListeners() {
    // Filter form listeners
    const topMdInput = document.getElementById("filterTopMd");
    const botMdInput = document.getElementById("filterBotMd");
    const iconNameInput = document.getElementById("filterIconName");

    // Add event listeners to sync form changes with URL
    if (topMdInput) {
        topMdInput.addEventListener('input', debounce(() => {
            const value = topMdInput.value ? parseInt(topMdInput.value) : null;
            urlManager.updateURLParams({ top_md: value });
            fetchWellboreData();
        }, 500));
    }

    if (botMdInput) {
        botMdInput.addEventListener('input', debounce(() => {
            const value = botMdInput.value ? parseInt(botMdInput.value) : null;
            urlManager.updateURLParams({ bot_md: value });
            fetchWellboreData();
        }, 500));
    }

    if (iconNameInput) {
        iconNameInput.addEventListener('input', debounce(() => {
            urlManager.updateURLParams({ icon_name: iconNameInput.value });
            fetchWellboreData();
        }, 500));
    }
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function(event) {
    let modals = document.getElementsByClassName("modal");
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = "none";
        }
    }
};

// Zoom and fullscreen functions
let scale = 1;

function zoomIn() {
    scale += 0.1;
    document.getElementById("wellbore").style.transform = `scale(${scale})`;
}

function zoomOut() {
    if (scale > 0.2) {
        scale -= 0.1;
        document.getElementById("wellbore").style.transform = `scale(${scale})`;
    }
}

function resetZoom() {
    scale = 1;
    document.getElementById("wellbore").style.transform = "scale(1)";
}

function toggleFullScreen() {
    const diagram = document.getElementById("diagram-container");
    if (!document.fullscreenElement) {
        diagram.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

let data = [];

// Enhanced fetch function with URL parameter support
const fetchWellboreData = async () => {
    try {
        const baseUrl = getApiBaseUrl();
        const params = urlManager.getAPIParams();
        
        // Build URL with parameters
        const urlParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                urlParams.append(key, params[key]);
            }
        });

        const url = `${baseUrl}/api/wellbore-data?${urlParams.toString()}`;
        console.log("🔗 Fetching data from:", url);
        
        const response = await makeApiRequest(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from API: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
        console.log('✅ Fetched filtered data:', data);
        
        renderDiagram();
        setTimeout(renderRemarksWithTooltip, 500);

    } catch (error) {
        console.error('❌ Error fetching wellbore data:', error);
        alert(`Error fetching data: ${error.message}\n\nPlease check:\n1. Backend server is running\n2. Ngrok URL is correct\n3. Network connection`);
    }
};

// Apply filter function (triggered by button click)
const applyFilter = () => {
    const topMd = document.getElementById("filterTopMd").value;
    const botMd = document.getElementById("filterBotMd").value;
    const iconName = document.getElementById("filterIconName").value;

    console.log("🔍 Applying filter - Top:", topMd, "Bot:", botMd, "Icon:", iconName);

    // Update URL parameters
    urlManager.updateURLParams({
        top_md: topMd ? parseInt(topMd) : null,
        bot_md: botMd ? parseInt(botMd) : null,
        icon_name: iconName || null
    });

    fetchWellboreData();
};

// Reset filter function
const resetFilter = () => {
    document.getElementById("filterTopMd").value = "";
    document.getElementById("filterBotMd").value = "";
    document.getElementById("filterIconName").value = "";
    
    // Reset URL parameters
    urlManager.updateURLParams({
        top_md: null,
        bot_md: null,
        icon_name: null
    });

    fetchWellboreData();
};

const iconNames = [
    { name: "SurfCsg", src: "img/SurfCsg.png" },
    { name: "IntermCsg", src: "img/IntermCsg.png" },
    { name: "ProdCsg", src: "img/ProdCsg.png" },
    { name: "Tubing", src: "img/Tubing.png" },
    { name: "ESPump", src: "img/ESPump.png" },
    { name: "PKR", src: "img/PKR.png" }
];

const width = 450, height = 800;
const svg = document.getElementById("wellbore");

const renderDiagram = () => {
    if (!svg) {
        console.warn("SVG element not found");
        return;
    }

    svg.innerHTML = '';
    
    if (!data || data.length === 0) {
        console.log("⚠️ No data available to render");
        return;
    }

    const maxDepth = Math.max(...data.map(d => d.BOT_MD));
    const yScale = depth => (depth / maxDepth) * height;
    const maxOD = Math.max(...data.map(d => d.OD_INCH));
    const widthScale = od => (od / maxOD) * 150;

    data.sort((a, b) => b.OD_INCH - a.OD_INCH);

    // Render depth scale
    const scaleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (let i = 0; i <= maxDepth; i += 200) {
        const yPos = yScale(i);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 60);
        line.setAttribute("x2", 80);
        line.setAttribute("y1", yPos);
        line.setAttribute("y2", yPos);
        svg.appendChild(line);

        const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tick.setAttribute("x1", 60);
        tick.setAttribute("x2", 80);
        tick.setAttribute("y1", yPos);
        tick.setAttribute("y2", yPos);
        scaleGroup.appendChild(tick);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", 40);
        label.setAttribute("y", yPos + 5);
        label.textContent = i;
        scaleGroup.appendChild(label);
    }
    svg.appendChild(scaleGroup);

    const remarkPositions = { left: [], right: [] };

    data.sort((a, b) => a.BOT_MD - b.BOT_MD);

    const perforationOpenComponents = data.filter(d => d.ICON_NAME === "PerfoOpen");
    const perforationCloseComponents = data.filter(d => d.ICON_NAME === "PerfoCls");
    const perforationSqzComponents = data.filter(d => d.ICON_NAME === "PerfoSqz");
    const tbgPumpComponents = data.filter(d => d.ICON_NAME === "TbgPump");
    const tubingComponents = data.filter(d => d.ICON_NAME === "Tubing");
    const otherComponents = data.filter(d => d.ICON_NAME !== "TbgPump" && d.ICON_NAME !== "Tubing");

    otherComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    tubingComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    perforationOpenComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    perforationCloseComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    perforationSqzComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);

    const sortedComponents = [...otherComponents, ...tubingComponents, ...tbgPumpComponents, ...perforationOpenComponents, ...perforationCloseComponents, ...perforationSqzComponents];

    sortedComponents.forEach((component, index) => {
        if (component.TOP_MD >= component.BOT_MD) {
            console.warn(`Invalid component dimensions: ${JSON.stringify(component)}`);
            return;
        }
        
        const MIN_HEIGHT = 10;
        const imgHeight = Math.max(MIN_HEIGHT, yScale(component.BOT_MD - component.TOP_MD));
        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        const imgWidth = widthScale(component.OD_INCH);
        const xPos = (width / 2) - (imgWidth / 2) + 200;
        const yPos = yScale(component.TOP_MD);

        const baseUrl = getApiBaseUrl();
        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", `${baseUrl}/img/${component.ICON_NAME}.png`);
        img.setAttribute("x", xPos);
        img.setAttribute("y", yPos);
        img.setAttribute("width", imgWidth);
        img.setAttribute("height", imgHeight);
        img.setAttribute("preserveAspectRatio", "none");
        svg.appendChild(img);

        // Add remarks if available
        if (component.REMARKS) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

            let yBottom = yScale(component.BOT_MD);
            const isLeft = index % 2 === 0;
            const lineLength = 40;

            const side = isLeft ? "left" : "right";
            remarkPositions[side].forEach(pos => {
                if (Math.abs(yBottom - pos) < 40) {
                    yBottom += 40;
                }
            });
            remarkPositions[side].push(yBottom);

            line.setAttribute("x1", isLeft ? xPos - 10 : xPos + imgWidth + 10);
            line.setAttribute("y1", yScale(component.BOT_MD));
            line.setAttribute("x2", isLeft ? xPos - lineLength : xPos + imgWidth + lineLength);
            line.setAttribute("y2", yBottom);
            line.setAttribute("stroke", "red");
            line.setAttribute("stroke-width", "2");
            svg.appendChild(line);

            text.setAttribute("x", isLeft ? xPos - lineLength - 5 : xPos + imgWidth + lineLength + 5);
            text.setAttribute("y", yBottom + 5);
            text.setAttribute("font-size", "12");
            text.setAttribute("fill", "red");
            text.textContent = component.ICON_NAME + ": " + component.REMARKS;
            text.setAttribute("text-anchor", isLeft ? "end" : "start");
            text.classList.add("remarks");
            text.setAttribute("data-text", `${component.ICON_NAME}: ${component.REMARKS}`);

            text.textContent = window.innerWidth > 768 ? `${component.ICON_NAME}: ${component.REMARKS}` : "";

            if (window.innerWidth <= 768) {
                const icon = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                const iconX = isLeft ? xPos - lineLength : xPos + imgWidth + lineLength;
                const iconY = yBottom;

                icon.setAttribute("cx", iconX);
                icon.setAttribute("cy", iconY);
                icon.setAttribute("r", 6);
                icon.setAttribute("fill", "red");
                icon.classList.add("remarks-icon");

                icon.addEventListener("mouseover", (e) => showTooltip(e, `${component.ICON_NAME}: ${component.REMARKS}`));
                icon.addEventListener("mouseout", hideTooltip);
                icon.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    showTooltip(e, `${component.ICON_NAME}: ${component.REMARKS}`);
                });
                icon.addEventListener("touchend", hideTooltip);

                svg.appendChild(icon);
            } else {
                svg.appendChild(text);
            }

            updateRemarksTooltip();
        }
    });
    
    populateIconList();
    populateEditDropdown();
};

const populateEditDropdown = () => {
    const dropdown = document.getElementById("editIconName");
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Select Component</option>';
    data.forEach(d => {
        const option = document.createElement("option");
        option.value = d.ICON_NAME;
        option.textContent = d.ICON_NAME;
        dropdown.appendChild(option);
    });
};

const populateIconList = async () => {
    const container = document.getElementById("icon-list");
    if (!container) return;
    
    container.innerHTML = '';

    try {
        const baseUrl = getApiBaseUrl();
        console.log("🔗 Fetching icons from:", `${baseUrl}/api/icons`);
        
        const response = await makeApiRequest(`${baseUrl}/api/icons`);
        const icons = await response.json();

        icons.forEach(icon => {
            const iconItem = document.createElement("div");
            iconItem.className = "icon-item";

            const img = document.createElement("img");
            img.src = `${baseUrl}/img/${icon}`;
            img.alt = icon;
            img.draggable = true;

            img.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify({ name: icon.split('.')[0] }));
            });

            const label = document.createElement("span");
            label.textContent = icon.split('.')[0];

            iconItem.appendChild(img);
            iconItem.appendChild(label);
            container.appendChild(iconItem);
        });
    } catch (err) {
        console.error('❌ Error fetching icons:', err);
        alert(`Error loading icons: ${err.message}`);
    }
};

const fillEditForm = () => {
    const selectedIcon = document.getElementById("editIconName").value;
    const component = data.find(d => d.ICON_NAME === selectedIcon);
    const disabledComponents = ['SurfCsg', 'IntermCsg', 'ProdCsg'];
    const isDisabled = disabledComponents.includes(selectedIcon);

    document.getElementById("editTopMd").value = component ? component.TOP_MD : '';
    document.getElementById("editBotMd").value = component ? component.BOT_MD : '';
    document.getElementById("editOdInch").value = component ? component.OD_INCH : '';

    document.getElementById("editTopMd").disabled = isDisabled;
    document.getElementById("editBotMd").disabled = isDisabled;
    document.getElementById("editOdInch").disabled = isDisabled;
};

const editComponent = () => {
    const selectedIcon = document.getElementById("editIconName").value;
    const topMd = parseFloat(document.getElementById("editTopMd").value);
    const botMd = parseFloat(document.getElementById("editBotMd").value);
    const odInch = parseFloat(document.getElementById("editOdInch").value);

    const index = data.findIndex(d => d.ICON_NAME === selectedIcon);
    if (index > -1) {
        data[index] = { ICON_NAME: selectedIcon, TOP_MD: topMd, BOT_MD: botMd, OD_INCH: odInch };
        renderDiagram();
        setTimeout(renderRemarksWithTooltip, 500);
    }
};

const enableDropOnDiagram = () => {
    if (!svg) return;
    
    svg.addEventListener("dragover", (e) => {
        e.preventDefault();
        svg.style.borderColor = "blue";
    });

    svg.addEventListener("dragleave", () => {
        svg.style.borderColor = "black";
    });

    svg.addEventListener("drop", (e) => {
        e.preventDefault();
        svg.style.borderColor = "black";

        const iconData = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (!iconData || !iconData.name) return;

        const yPos = e.offsetY;
        const maxDepth = Math.max(...data.map(d => d.BOT_MD) || [1000]);
        const newDepth = (yPos / height) * maxDepth;

        const newComponent = {
            ICON_NAME: iconData.name,
            TOP_MD: Math.round(newDepth),
            BOT_MD: Math.round(newDepth + 500),
            OD_INCH: 5,
            REMARKS: `${iconData.name} dropped at ${Math.round(newDepth)} ft`
        };
        data.push(newComponent);

        renderDiagram();
        setTimeout(renderRemarksWithTooltip, 500);
    });
};

const downloadWellboreDiagram = () => {
    const svgElement = document.getElementById("wellbore");
    if (!svgElement) return;

    const preloadImages = (svgElement, callback) => {
        const images = Array.from(svgElement.querySelectorAll("image"));
        const loadedImages = [];
        let loadedCount = 0;

        images.forEach((img, index) => {
            const href = img.getAttributeNS("http://www.w3.org/1999/xlink", "href");
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.src = href;

            image.onload = () => {
                loadedImages[index] = image;
                loadedCount++;
                if (loadedCount === images.length) {
                    callback(loadedImages);
                }
            };

            image.onerror = () => {
                console.error("Failed to load image:", href);
                loadedCount++;
                if (loadedCount === images.length) {
                    callback(loadedImages);
                }
            };
        });

        if (images.length === 0) callback([]);
    };

    const svgToCanvas = (svgElement) => {
        preloadImages(svgElement, (loadedImages) => {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const svgSize = svgElement.getBoundingClientRect();
            canvas.width = svgSize.width * 2;
            canvas.height = svgSize.height * 2;

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const img = new Image();
            img.onload = () => {
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0);

                Array.from(svgElement.querySelectorAll("image")).forEach((svgImg, index) => {
                    const x = parseFloat(svgImg.getAttribute("x"));
                    const y = parseFloat(svgImg.getAttribute("y"));
                    const width = parseFloat(svgImg.getAttribute("width"));
                    const height = parseFloat(svgImg.getAttribute("height"));

                    if (loadedImages[index]) {
                        ctx.drawImage(loadedImages[index], x, y, width, height);
                    }
                });

                const link = document.createElement("a");
                link.download = "wellbore-diagram.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
            };

            img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
        });
    };

    svgToCanvas(svgElement);
};

// Add event listener for download button
document.addEventListener("DOMContentLoaded", () => {
    const downloadBtn = document.getElementById("download-btn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadWellboreDiagram);
    }
});

// Utility functions for URL management
window.updateApiConfig = (ngrokUrl) => {
    API_CONFIG.NGROK_URL = ngrokUrl;
    console.log("🌐 API configuration updated:", {
        baseUrl: getApiBaseUrl(),
        ngrokUrl: API_CONFIG.NGROK_URL
    });
    
    fetchWellboreData();
};

window.testApiConnection = async () => {
    try {
        const baseUrl = getApiBaseUrl();
        console.log("🔍 Testing API connection to:", baseUrl);
        
        const response = await makeApiRequest(`${baseUrl}/health`);
        const result = await response.json();
        
        console.log("✅ API connection test successful:", result);
        alert(`API Connection Successful!\n\nStatus: ${result.status}\nMessage: ${result.message}\nURL: ${baseUrl}`);
        return true;
    } catch (error) {
        console.error("❌ API connection test failed:", error);
        alert(`API Connection Failed!\n\nError: ${error.message}\nURL: ${getApiBaseUrl()}\n\nPlease check:\n1. Backend server is running\n2. Ngrok URL is correct\n3. Network connection`);
        return false;
    }
};

// Get current URL parameters (for debugging)
window.getCurrentParams = () => {
    return urlManager.getAPIParams();
};

// Manually update URL parameters (for debugging)
window.setURLParams = (params) => {
    urlManager.updateURLParams(params);
    fetchWellboreData();
};

// Handle browser back/forward navigation
window.addEventListener('popstate', (event) => {
    console.log('🔄 Browser navigation detected, reloading data...');
    urlManager.currentParams = urlManager.getURLParams();
    urlManager.initializeFromURL();
    fetchWellboreData();
});

console.log("📱 Wellbore Diagram App Initialized with URL Parameter Support");
console.log("🌐 Current API Base URL:", getApiBaseUrl());
console.log("🔗 Current URL Parameters:", urlManager.getAPIParams());
console.log("💡 Available functions:");
console.log("  - updateApiConfig('https://your-ngrok-url.ngrok.io')");
console.log("  - testApiConnection()");
console.log("  - getCurrentParams()");
console.log("  - setURLParams({uwi: 'WELL123', top_md: 1000})");

// Initialize the application
fetchWellboreData();
populateIconList();
enableDropOnDiagram();