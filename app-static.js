let data = [
{ ICON_NAME: 'SurfCsg', TOP_MD: 19, BOT_MD: 624, OD_INCH: 13.37 },
{ ICON_NAME: 'IntermCsg', TOP_MD: 19, BOT_MD: 3602, OD_INCH: 9.625 },
{ ICON_NAME: 'ProdCsg', TOP_MD: 19, BOT_MD: 5745, OD_INCH: 7 },
{ ICON_NAME: 'Tubing', TOP_MD: 19, BOT_MD: 4795, OD_INCH: 3.5 },
{ ICON_NAME: 'ESPump', TOP_MD: 4795, BOT_MD: 4802, OD_INCH: 5 },
{ ICON_NAME: 'PKR', TOP_MD: 4827, BOT_MD: 4958, OD_INCH: 4.5 }
];

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
for (let i = 0; i <= maxDepth; i += 500) {
const yPos = yScale(i);

const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
line.setAttribute("x1", 30);
line.setAttribute("x2", 50);
line.setAttribute("y1", yPos);
line.setAttribute("y2", yPos);
line.setAttribute("stroke", "black");
svg.appendChild(line);

// Garis skala
const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
tick.setAttribute("x1", 30);
tick.setAttribute("x2", 50);
tick.setAttribute("y1", yPos);
tick.setAttribute("y2", yPos);
tick.setAttribute("stroke", "black");
scaleGroup.appendChild(tick);

// Label skala
const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
label.setAttribute("x", 10);
label.setAttribute("y", yPos + 5);
label.textContent = i;
scaleGroup.appendChild(label);
}
svg.appendChild(scaleGroup);

data.forEach(component => {
const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
const imgWidth = widthScale(component.OD_INCH);
const imgHeight = yScale(component.BOT_MD - component.TOP_MD);
const xPos = (width / 2) - (imgWidth / 2);
const yPos = yScale(component.TOP_MD);

img.setAttributeNS("http://www.w3.org/1999/xlink", "href", `img/${component.ICON_NAME}.png`);
img.setAttribute("x", xPos);
img.setAttribute("y", yPos);
img.setAttribute("width", imgWidth);
img.setAttribute("height", imgHeight);
img.setAttribute("preserveAspectRatio", "none");
svg.appendChild(img);
});
populateIconList();
populateEditDropdown();

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
img.addEventListener("dragstart", (e) => {
e.dataTransfer.setData("text/plain", icon.name); // Pastikan nama ikon disimpan di dataTransfer
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

const iconName = e.dataTransfer.getData("text/plain"); // Ambil data dari dragstart
if (!iconName) return; // Jika tidak ada data, hentikan

const yPos = e.offsetY; // Posisi Y dari lokasi drop
const maxDepth = Math.max(...data.map(d => d.BOT_MD)); // Kedalaman maksimum
const newDepth = (yPos / height) * maxDepth; // Konversi ke kedalaman

// Tambahkan komponen baru ke data
const component = { ICON_NAME: iconName, TOP_MD: Math.round(newDepth), BOT_MD: Math.round(newDepth + 500), OD_INCH: 5 };
data.push(component);

renderDiagram(); // Render ulang diagram setelah drop
});
};

console.log(document.getElementById("icon-list").innerHTML);

renderDiagram();
populateIconList();
enableDropOnDiagram();