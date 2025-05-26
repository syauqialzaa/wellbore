// Pastikan elemen tooltip dibuat di awal
let tooltip = document.getElementById("tooltip");
if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
}

function showTooltip(event, text) {
    // console.log("🔥 showTooltip() terpanggil untuk:", text);

    tooltip.innerHTML = text;
    tooltip.style.display = "block";

    let x = event.pageX || (event.touches && event.touches[0].clientX) || event.clientX;
    let y = event.pageY || (event.touches && event.touches[0].clientY) || event.clientY;

    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
}


// Fungsi untuk menyembunyikan tooltip
function hideTooltip() {
    tooltip.style.display = "none";
}

function renderRemarksWithTooltip() {
    const remarks = document.querySelectorAll(".remarks");

    // console.log("✅ Jumlah remarks ditemukan:", remarks.length);

    remarks.forEach(remark => {
        // console.log("🔹 Menambahkan event listener untuk:", remark.dataset.text);

        remark.addEventListener("mouseover", (e) => {
            // console.log("🚀 Event `mouseover` berhasil dipanggil:", remark.dataset.text);
            showTooltip(e, remark.dataset.text);
        });

        remark.addEventListener("mousemove", (e) => showTooltip(e, remark.dataset.text));
        remark.addEventListener("mouseout", hideTooltip);

        // Event untuk Mobile
        remark.addEventListener("touchstart", (e) => {
            e.preventDefault(); // Hindari zoom saat tap
            // console.log("📱 Event `touchstart` berhasil dipanggil:", remark.dataset.text);
            let touch = e.touches[0];
            showTooltip(touch, remark.dataset.text);
        });

        remark.addEventListener("touchend", hideTooltip);
    });
}


// Pastikan tooltip di-rebind setiap kali diagram dirender ulang
function updateRemarksTooltip() {
    setTimeout(renderRemarksWithTooltip, 500); // Delay untuk memastikan elemen tersedia
}

// Pastikan tooltip aktif setelah diagram dirender ulang
// document.addEventListener("DOMContentLoaded", renderRemarksWithTooltip);

document.addEventListener("DOMContentLoaded", () => {
    // console.log("📌 DOM telah dimuat, inisialisasi aplikasi...");

    renderDiagram(); // Render diagram awal

    // Event listener untuk menangani perubahan ukuran layar
    window.addEventListener("resize", () => {
        // console.log("🔄 Layar berubah, memperbarui diagram...");
        renderDiagram();
    });
});


// Fungsi untuk membuka modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

// Fungsi untuk menutup modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Pastikan modal bisa ditutup dengan mengklik di luar area modal
window.onclick = function(event) {
    let modals = document.getElementsByClassName("modal");
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = "none";
        }
    }
};



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



let data = []; // Data awal akan diambil dari API

const fetchWellboreData = async (topMd = null, botMd = null) => {
    try {
        let url = 'http://127.0.0.1:5000/api/wellbore-data';

        let params = new URLSearchParams();
        if (topMd !== null) params.append("top_md", topMd);
        if (botMd !== null) params.append("bot_md", botMd);

        if (params.toString()) {
            url += "?" + params.toString();
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data from API');
        }
        data = await response.json();
        console.log('Fetched filtered data:', data);
        renderDiagram();
        setTimeout(renderRemarksWithTooltip, 500); // Pastikan event listener ditambahkan ulang setelah diagram diperbarui

    } catch (error) {
        console.error('Error fetching wellbore data:', error);
    }
};
const applyFilter = () => {
    const topMd = document.getElementById("filterTopMd").value;
    const botMd = document.getElementById("filterBotMd").value;

    console.log("top: ", topMd, "bot: ", botMd)

    if (topMd && botMd) {
        fetchWellboreData(parseInt(topMd), parseInt(botMd));
    } else {
        alert("Please enter both TOP_MD and BOT_MD values.");
    }
};

const resetFilter = () => {
    document.getElementById("filterTopMd").value = "";
    document.getElementById("filterBotMd").value = "";
    fetchWellboreData(); // Ambil semua data tanpa filter
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
    svg.innerHTML = '';
    const maxDepth = Math.max(...data.map(d => d.BOT_MD));
    const yScale = depth => (depth / maxDepth) * height;
    const maxOD = Math.max(...data.map(d => d.OD_INCH));
    const widthScale = od => (od / maxOD) * 150;

    data.sort((a, b) => b.OD_INCH - a.OD_INCH);

    // Render skala kedalaman dengan kelipatan 100
    const scaleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (let i = 0; i <= maxDepth; i += 200) {
        const yPos = yScale(i);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 60); // Geser skala ke kanan
        line.setAttribute("x2", 80);
        line.setAttribute("y1", yPos);
        line.setAttribute("y2", yPos);
        svg.appendChild(line);

        // Garis skala
        const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tick.setAttribute("x1", 60);
        tick.setAttribute("x2", 80);
        tick.setAttribute("y1", yPos);
        tick.setAttribute("y2", yPos);
        scaleGroup.appendChild(tick);

        // Label skala
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", 40);
        label.setAttribute("y", yPos + 5);
        label.textContent = i;
        scaleGroup.appendChild(label);
    }
    svg.appendChild(scaleGroup);

    const remarkPositions = { left: [], right: [] }; // Track Y positions of remarks to avoid overlap separately for left and right

    const MIN_GAP = 20; // Jarak minimum antar remark

    data.sort((a, b) => a.BOT_MD - b.BOT_MD); // Urutkan berdasarkan BOT_MD

    // Pisahkan Tubing dan TbgPump agar dirender terakhir
    const perforationOpenComponents = data.filter(d => d.ICON_NAME === "PerfoOpen");
    const perforationCloseComponents = data.filter(d => d.ICON_NAME === "PerfoCls");
    const perforationSqzComponents = data.filter(d => d.ICON_NAME === "PerfoSqz");
    const tbgPumpComponents = data.filter(d => d.ICON_NAME === "TbgPump");
    const tubingComponents = data.filter(d => d.ICON_NAME === "Tubing");
    const otherComponents = data.filter(d => d.ICON_NAME !== "TbgPump" && d.ICON_NAME !== "Tubing");

    // console.log("Other Component : ", otherComponents);
    // Urutkan berdasarkan BOT_MD untuk memastikan urutan dari atas ke bawah
    otherComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    tubingComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    perforationOpenComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    perforationCloseComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);
    perforationSqzComponents.sort((a, b) => a.BOT_MD - b.BOT_MD);

    // Gabungkan kembali dengan Tubing dan TbgPump di akhir, sehingga mereka dirender terakhir
    const sortedComponents = [...otherComponents, ...tubingComponents, ...tbgPumpComponents, ...perforationOpenComponents, ...perforationCloseComponents, ...perforationSqzComponents];

    sortedComponents.forEach((component, index) => {
        if (component.TOP_MD >= component.BOT_MD) {
            console.warn(`Invalid component dimensions: ${JSON.stringify(component)}`);
            return;
        }
        const MIN_HEIGHT = 10; // Tinggi minimum ikon (dalam piksel)
        const imgHeight = Math.max(MIN_HEIGHT, yScale(component.BOT_MD - component.TOP_MD));
        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        const imgWidth = widthScale(component.OD_INCH);
        // const imgHeight = yScale(component.BOT_MD - component.TOP_MD);
        const xPos = (width / 2) - (imgWidth / 2) + 200; // Geser wellbore diagram ke kanan
        const yPos = yScale(component.TOP_MD);
        // console.log(`Drawing icon for: ${component.ICON_NAME}, TOP_MD: ${component.TOP_MD}, BOT_MD: ${component.BOT_MD}, x: ${xPos}, y: ${yPos}, width: ${imgWidth}, height: ${imgHeight}`);


        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", `img/${component.ICON_NAME}.png`);
        img.setAttribute("x", xPos);
        img.setAttribute("y", yPos);
        img.setAttribute("width", imgWidth);
        img.setAttribute("height", imgHeight);
        img.setAttribute("preserveAspectRatio", "none");
        svg.appendChild(img);

        // Tambahkan panah dan keterangan jika ada remark
        if (component.REMARKS) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

            let yBottom = yScale(component.BOT_MD); // Hitung posisi y berdasarkan BOT_MD

            const isLeft = index % 2 === 0; // Alternatif posisi kiri/kanan
            const lineLength = 40; // Panjang garis lurus ke remark

            // Pastikan tidak bertumpuk dengan posisi sebelumnya
            const side = isLeft ? "left" : "right";
            remarkPositions[side].forEach(pos => {
                if (Math.abs(yBottom - pos) < 40) { // Jarak minimum antar remark dinaikkan untuk menghindari tumpukan
                    yBottom += 40; // Geser ke bawah jika bertumpuk
                }
            });
            remarkPositions[side].push(yBottom); // Tambahkan posisi ke tracker sisi yang sesuai

            // Garis lurus ke remark
            line.setAttribute("x1", isLeft ? xPos - 10 : xPos + imgWidth + 10);
            line.setAttribute("y1", yScale(component.BOT_MD)); // Garis dimulai dari BOT_MD
            line.setAttribute("x2", isLeft ? xPos - lineLength : xPos + imgWidth + lineLength);
            line.setAttribute("y2", yBottom);
            line.setAttribute("stroke", "red");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("x2", isLeft ? xPos - lineLength : xPos + imgWidth + lineLength);
            svg.appendChild(line);

            // Koordinat teks, letakkan di sebelah kanan/kiri ujung garis
            text.setAttribute("x", isLeft ? xPos - lineLength - 5 : xPos + imgWidth + lineLength + 5); // Teks di sebelah kanan/kiri garis
            text.setAttribute("y", yBottom + 5); // Teks sedikit di samping garis
            text.setAttribute("font-size", "12");
            text.setAttribute("fill", "red");
            text.textContent = component.ICON_NAME + ": " +component.REMARKS; // Isi teks dari REMARK
            text.setAttribute("text-anchor", isLeft ? "end" : "start"); // Penyesuaian anchor teks
            text.classList.add("remarks");  // Tambahkan class untuk tooltip
            text.setAttribute("data-text", `${component.ICON_NAME}: ${component.REMARKS}`); // Data untuk tooltip

            text.textContent = window.innerWidth > 768 ? `${component.ICON_NAME}: ${component.REMARKS}` : ""; // Sembunyikan text di mobile
            // console.log("Menambahkan remarks:", text.textContent); // Debugging


            // Buat icon pengganti di mobile
            console.log("window : ", window.innerWidth);
            if (window.innerWidth <= 768) {
                const icon = document.createElementNS("http://www.w3.org/2000/svg", "circle");

                // Tempatkan icon di ujung garis remarks
                const iconX = isLeft ? xPos - lineLength : xPos + imgWidth + lineLength;
                const iconY = yBottom;

                icon.setAttribute("cx", iconX);
                icon.setAttribute("cy", iconY);
                icon.setAttribute("r", 6);
                icon.setAttribute("fill", "red");
                icon.classList.add("remarks-icon");

                // 🛠 Tambahkan event listener untuk menampilkan tooltip
                icon.addEventListener("mouseover", (e) => showTooltip(e, `${component.ICON_NAME}: ${component.REMARKS}`));
                icon.addEventListener("mouseout", hideTooltip);
                icon.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    showTooltip(e, `${component.ICON_NAME}: ${component.REMARKS}`);
                });
                icon.addEventListener("touchend", hideTooltip);

                console.log(`📍 Menambahkan icon di posisi: (${iconX}, ${iconY})`);
                svg.appendChild(icon); // Tambahkan icon ke SVG
            } else {
                console.log("desktop");
                svg.appendChild(text); // Tambahkan text setelah icon
            }

            updateRemarksTooltip(); // Pastikan tooltip diperbarui

        }

    });
    populateIconList();
    populateEditDropdown();

};




// Fungsi untuk menggambar setiap komponen
const drawComponent = (component) => {
    if (component.TOP_MD >= component.BOT_MD) {
        console.warn(`Invalid component dimensions: ${JSON.stringify(component)}`);
        return;
    }

    const MIN_HEIGHT = 10; // Tinggi minimum ikon (dalam piksel)
    const imgHeight = Math.max(MIN_HEIGHT, yScale(component.BOT_MD - component.TOP_MD));
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    const imgWidth = widthScale(component.OD_INCH);
    const xPos = (width / 2) - (imgWidth / 2) + 200; // Geser wellbore diagram ke kanan
    const yPos = yScale(component.TOP_MD);

    console.log(`Drawing icon for: ${component.ICON_NAME}, TOP_MD: ${component.TOP_MD}, BOT_MD: ${component.BOT_MD}, x: ${xPos}, y: ${yPos}, width: ${imgWidth}, height: ${imgHeight}`);

    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", `img/${component.ICON_NAME}.png`);
    img.setAttribute("x", xPos);
    img.setAttribute("y", yPos);
    img.setAttribute("width", imgWidth);
    img.setAttribute("height", imgHeight);
    img.setAttribute("preserveAspectRatio", "none");
    svg.appendChild(img);

    // Tambahkan panah dan keterangan jika ada remark
    if (component.REMARKS) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

        let yBottom = yScale(component.BOT_MD); // Hitung posisi y berdasarkan BOT_MD

        const isLeft = index % 2 === 0; // Alternatif posisi kiri/kanan
        const lineLength = 60; // Panjang garis lurus ke remark

        // Pastikan tidak bertumpuk dengan posisi sebelumnya
        const side = isLeft ? "left" : "right";
        remarkPositions[side].forEach(pos => {
            if (Math.abs(yBottom - pos) < 40) { // Jarak minimum antar remark dinaikkan untuk menghindari tumpukan
                yBottom += 40; // Geser ke bawah jika bertumpuk
            }
        });
        remarkPositions[side].push(yBottom); // Tambahkan posisi ke tracker sisi yang sesuai

        // Garis lurus ke remark
        line.setAttribute("x1", isLeft ? xPos - 10 : xPos + imgWidth + 10);
        line.setAttribute("y1", yScale(component.BOT_MD)); // Garis dimulai dari BOT_MD
        line.setAttribute("x2", isLeft ? xPos - lineLength : xPos + imgWidth + lineLength);
        line.setAttribute("y2", yBottom);
        line.setAttribute("stroke", "red");
        line.setAttribute("stroke-width", "2");

        svg.appendChild(line);

        // Koordinat teks, letakkan di sebelah kanan/kiri ujung garis
        text.setAttribute("x", isLeft ? xPos - lineLength - 5 : xPos + imgWidth + lineLength + 5); // Teks di sebelah kanan/kiri garis
        text.setAttribute("y", yBottom + 5); // Teks sedikit di samping garis
        text.setAttribute("font-size", "12");
        text.setAttribute("fill", "red");
        text.textContent = component.ICON_NAME + ": " +component.REMARKS; // Isi teks dari REMARK
        text.setAttribute("text-anchor", isLeft ? "end" : "start"); // Penyesuaian anchor teks
        svg.appendChild(text);
    }
};

const populateEditDropdown = () => {
    const dropdown = document.getElementById("editIconName");
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
    container.innerHTML = '';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/icons'); // Flask API untuk mendapatkan daftar file
        const icons = await response.json();

        icons.forEach(icon => {
            const iconItem = document.createElement("div");
            iconItem.className = "icon-item";

            const img = document.createElement("img");
            img.src = `http://127.0.0.1:5000/img/${icon}`; // Path ke gambar di Flask
            img.alt = icon;
            img.draggable = true;

            // Tambahkan event dragstart
            img.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify({ name: icon.split('.')[0] })); // Simpan nama ikon
            });

            const label = document.createElement("span");
            label.textContent = icon.split('.')[0]; // Nama file tanpa ekstensi

            iconItem.appendChild(img);
            iconItem.appendChild(label);
            container.appendChild(iconItem);
        });
    } catch (err) {
        console.error('Error fetching icons:', err);
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
        setTimeout(renderRemarksWithTooltip, 500); // Pastikan event listener ditambahkan ulang setelah diagram diperbarui

    }
};

const enableDropOnDiagram = () => {
    svg.addEventListener("dragover", (e) => {
        e.preventDefault(); // Harus mencegah default untuk memungkinkan drop
        svg.style.borderColor = "blue"; // Opsional: Indikasi bahwa area siap untuk drop
    });

    svg.addEventListener("dragleave", () => {
        svg.style.borderColor = "black"; // Reset style jika drag keluar
    });

    svg.addEventListener("drop", (e) => {
        e.preventDefault();
        svg.style.borderColor = "black"; // Reset style setelah drop

        const iconData = JSON.parse(e.dataTransfer.getData("text/plain")); // Ambil data dari dragstart
        if (!iconData || !iconData.name) return; // Jika tidak ada data, hentikan

        const yPos = e.offsetY; // Posisi Y dari lokasi drop
        const maxDepth = Math.max(...data.map(d => d.BOT_MD) || [1000]); // Kedalaman maksimum (default 1000 jika kosong)
        const newDepth = (yPos / height) * maxDepth; // Konversi ke kedalaman

        // Tambahkan komponen baru ke data
        const newComponent = {
            ICON_NAME: iconData.name,
            TOP_MD: Math.round(newDepth),
            BOT_MD: Math.round(newDepth + 500), // Panjang default 500 ft
            OD_INCH: 5, // Ukuran default
            REMARKS: `${iconData.name} dropped at ${Math.round(newDepth)} ft` // Remark default
        };
        data.push(newComponent);

        // renderDiagram(); // Render ulang diagram setelah drop
        renderDiagram();
        setTimeout(renderRemarksWithTooltip, 500); // Pastikan event listener ditambahkan ulang setelah diagram diperbarui

    });
};

const downloadWellboreDiagram = () => {
    const svgElement = document.getElementById("wellbore");

    const preloadImages = (svgElement, callback) => {
        const images = Array.from(svgElement.querySelectorAll("image")); // Ambil semua elemen <image>
        const loadedImages = [];
        let loadedCount = 0;

        images.forEach((img, index) => {
            const href = img.getAttributeNS("http://www.w3.org/1999/xlink", "href");
            const image = new Image();
            image.crossOrigin = "anonymous"; // Pastikan CORS diaktifkan
            image.src = href;

            image.onload = () => {
                loadedImages[index] = image;
                loadedCount++;
                if (loadedCount === images.length) {
                    callback(loadedImages); // Semua gambar berhasil dimuat
                }
            };

            image.onerror = () => {
                console.error("Failed to load image:", href);
                loadedCount++;
                if (loadedCount === images.length) {
                    callback(loadedImages); // Tetap lanjutkan meski ada gambar gagal dimuat
                }
            };
        });

        if (images.length === 0) callback([]); // Jika tidak ada gambar, langsung panggil callback
    };

    const svgToCanvas = (svgElement) => {
        preloadImages(svgElement, (loadedImages) => {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Dapatkan dimensi SVG
            const svgSize = svgElement.getBoundingClientRect();
            canvas.width = svgSize.width * 2; // Skala untuk resolusi tinggi
            canvas.height = svgSize.height * 2;

            // Tambahkan latar belakang putih
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Render ulang elemen <image>
            const img = new Image();
            img.onload = () => {
                ctx.scale(2, 2); // Terapkan skala ke canvas
                ctx.drawImage(img, 0, 0);

                // Tambahkan gambar pramuat ke canvas
                Array.from(svgElement.querySelectorAll("image")).forEach((svgImg, index) => {
                    const x = parseFloat(svgImg.getAttribute("x"));
                    const y = parseFloat(svgImg.getAttribute("y"));
                    const width = parseFloat(svgImg.getAttribute("width"));
                    const height = parseFloat(svgImg.getAttribute("height"));

                    // Gambar ulang setiap gambar dari pramuat
                    ctx.drawImage(loadedImages[index], x, y, width, height);
                });

                // Simpan hasil sebagai file PNG
                const link = document.createElement("a");
                link.download = "wellbore-diagram.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
            };

            // Set sumber data SVG sebagai gambar utama
            img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
        });
    };


    svgToCanvas(svgElement); // Panggil fungsi konversi
};

// Tambahkan event listener ke tombol download image
document.getElementById("download-btn").addEventListener("click", downloadWellboreDiagram);


// document.getElementById("download-pdf").addEventListener("click", async () => {
//     const { jsPDF } = window.jspdf;
//     const svgElement = document.getElementById("wellbore");
//
//     // Render diagram ke canvas menggunakan html2canvas
//     const canvas = await html2canvas(svgElement);
//     const imgData = canvas.toDataURL("image/png");
//
//     // Buat PDF dan tambahkan gambar ke PDF
//     const pdf = new jsPDF("portrait", "mm", "a4");
//     const imgWidth = 190; // Lebar dalam mm
//     const imgHeight = (canvas.height * imgWidth) / canvas.width; // Sesuaikan tinggi proporsional
//     pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
//     pdf.save("wellbore-diagram.pdf");
// });


console.log(document.getElementById("icon-list").innerHTML);

fetchWellboreData();
populateIconList();
enableDropOnDiagram();
