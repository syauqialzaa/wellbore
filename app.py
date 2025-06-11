from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv

import os
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
CORS(app, resources={r"/img/*": {"origins": "*"}})

# PostgreSQL Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    # Fallback to individual environment variables
    DB_HOST = os.getenv('PG_HOST')
    DB_PORT = os.getenv('PG_PORT')
    DB_NAME = os.getenv('PG_DATABASE')
    DB_USER = os.getenv('PG_USER')
    DB_PASSWORD = os.getenv('PG_PASSWORD')
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Path ke folder 'img'
IMG_FOLDER = os.path.join(os.getcwd(), 'img')

# Define table model
class WellboreComponent(db.Model):
    __tablename__ = 'wellbore_components'
    id_components = db.Column(db.String(20), primary_key=True)
    uwi = db.Column(db.String(20))
    string_code = db.Column(db.String(20))
    main_component = db.Column(db.String(50))
    sub_component = db.Column(db.String(50))
    icon_name = db.Column(db.String(20))
    install_date = db.Column(db.Date)
    top_md = db.Column(db.Integer)
    bot_md = db.Column(db.Integer)
    od_inch = db.Column(db.Float)
    seq = db.Column(db.Integer)
    remark = db.Column(db.String(255))

@app.route('/api/wellbore-data', methods=['GET'])
def get_wellbore_data():
    try:
        # Get URL parameters - enhanced to accept more parameters
        uwi = request.args.get('uwi', 'PEB000026D1')  # Default UWI
        top_md = request.args.get('top_md', type=int)
        bot_md = request.args.get('bot_md', type=int)
        icon_name = request.args.get('icon_name', type=str)  # New parameter for icon filtering
        
        print(f"Fetching wellbore data for UWI: {uwi}, TOP_MD: {top_md}, BOT_MD: {bot_md}, ICON: {icon_name}")

        # Start building query
        query = WellboreComponent.query.filter_by(uwi=uwi)

        # Apply depth filters
        if top_md is not None and bot_md is not None:
            query = query.filter(
                WellboreComponent.bot_md >= top_md, 
                WellboreComponent.top_md <= bot_md
            )
        elif top_md is not None:
            query = query.filter(WellboreComponent.top_md >= top_md)
        elif bot_md is not None:
            query = query.filter(WellboreComponent.bot_md <= bot_md)

        # Apply icon name filter if provided
        if icon_name:
            query = query.filter(WellboreComponent.icon_name.ilike(f'%{icon_name}%'))

        print(f"Generated Query: {query}")  # Debugging query

        components = query.all()

        if not components:
            print("No components found")  # Debugging
            return jsonify([]), 200  # Return empty array instead of 404

        # Keep the original response format
        result = [
            {
                "ICON_NAME": component.icon_name,
                "TOP_MD": component.top_md,
                "BOT_MD": component.bot_md,
                "OD_INCH": component.od_inch,
                "REMARKS": component.remark
            }
            for component in components
        ]

        return jsonify(result), 200

    except Exception as e:
        print("ERROR in /api/wellbore-data:", str(e))  # Log ke terminal
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@app.route('/api/wellbore-data1', methods=['GET'])
def get_wellbore_data1():
    """Legacy endpoint - keeping as is"""
    try:
        components = WellboreComponent.query.filter_by(uwi='PEB000026D1').all()
        
        for component in components:
            print("komponent", component)  # Cetak setiap objek yang diambil

        result = [
            {
                "ICON_NAME": component.icon_name,
                "TOP_MD": component.top_md,
                "BOT_MD": component.bot_md,
                "OD_INCH": component.od_inch,
                'REMARKS': component.remark
            }
            for component in components
        ]
        return jsonify(result)
    except Exception as e:
        print("ERROR in /api/wellbore-data1:", str(e))
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

# API untuk mendapatkan daftar file gambar di folder 'img'
@app.route('/api/icons', methods=['GET'])
def get_icons():
    try:
        # Optional search parameter for filtering icons
        search = request.args.get('search', type=str)
        
        files = [f for f in os.listdir(IMG_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg'))]
        
        # Apply search filter if provided
        if search:
            files = [f for f in files if search.lower() in f.lower()]
        
        return jsonify(files)  # Keep original response format - just array of filenames
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint untuk melayani file gambar
@app.route('/img/<path:filename>', methods=['GET'])
def serve_image(filename):
    return send_from_directory(IMG_FOLDER, filename)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Wellbore API is running"}), 200

@app.route('/api/screenshot', methods=['POST'])
def generate_screenshot():
    """Generate screenshot of wellbore diagram - Enhanced version with proper UWI handling"""
    try:
        print("📸 Screenshot endpoint called")
        
        # Get parameters from request with better error handling
        data = request.get_json() or {}
        uwi = data.get('uwi', 'PEB000026D1')
        width = data.get('width', 2000)  # Increased for better quality
        height = data.get('height', 1800)  # Increased for complete diagram
        top_md = data.get('top_md')  # Optional depth filter
        bot_md = data.get('bot_md')  # Optional depth filter
        icon_name = data.get('icon_name')  # Optional component filter
        
        print(f"📸 Screenshot request for UWI: {uwi}, Size: {width}x{height}")
        if top_md or bot_md:
            print(f"📏 Depth filter: {top_md} - {bot_md} ft")
        if icon_name:
            print(f"🔧 Component filter: {icon_name}")
        
        # Validate parameters
        if not uwi:
            return jsonify({
                "success": False,
                "error": "UWI parameter is required"
            }), 400
        
        # Build URL with proper parameters
        base_url = "https://syauqialzaa.github.io/wellbore/"
        params = [f"uwi={uwi}", "auto_load=true"]
        
        # Add optional filters only if specified
        if top_md is not None:
            params.append(f"top_md={top_md}")
        if bot_md is not None:
            params.append(f"bot_md={bot_md}")
        if icon_name:
            params.append(f"icon_name={icon_name}")
        
        url = f"{base_url}?" + "&".join(params)
        print(f"🔗 Target URL: {url}")
        
        # Enhanced Chrome options for larger viewport
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-background-timer-throttling")
        chrome_options.add_argument("--disable-backgrounding-occluded-windows")
        chrome_options.add_argument("--disable-renderer-backgrounding")
        chrome_options.add_argument("--disable-features=TranslateUI")
        chrome_options.add_argument("--disable-ipc-flooding-protection")
        chrome_options.add_argument(f"--window-size={width},{height}")
        chrome_options.add_argument("--force-device-scale-factor=1")
        
        print("🚀 Initializing Chrome driver...")
        
        # Initialize webdriver with error handling
        driver = None
        try:
            driver = webdriver.Chrome(options=chrome_options)
            print("✅ Chrome driver initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Chrome driver: {e}")
            return jsonify({
                "success": False,
                "error": f"WebDriver initialization failed: {str(e)}"
            }), 500
        
        try:
            # Set larger viewport
            driver.set_window_size(width, height)
            print(f"📏 Viewport set to {width}x{height}")
            
            # Navigate to the wellbore diagram
            print(f"🌐 Navigating to URL for UWI {uwi}...")
            driver.get(url)
            
            # Wait for initial DOM to load
            wait = WebDriverWait(driver, 30)  # Increased timeout
            print("⏳ Waiting for wellbore element...")
            wait.until(EC.presence_of_element_located((By.ID, "wellbore")))
            print("✅ Wellbore element found")
            
            # Wait for data to load specifically for the UWI
            print(f"📊 Waiting for {uwi} data to load...")
            time.sleep(12)  # Extended wait for complete loading
            
            # Hide UI elements and ensure complete data loading with safe null checking
            print("🎭 Hiding UI elements and ensuring complete data loading...")
            script_result = driver.execute_script("""
                try {
                    // Hide buttons and UI elements that might interfere
                    const elementsToHide = [
                        'button[onclick*="toggleFullScreen"]',
                        'button[onclick*="download"]',
                        '.download-btn',
                        '.fullscreen-btn',
                        '#download-btn',
                        '#fullscreen-btn',
                        '.control-buttons',
                        '.toolbar',
                        '.ui-controls'
                    ];
                    
                    let hiddenCount = 0;
                    elementsToHide.forEach(selector => {
                        try {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(el => {
                                if (el) {
                                    el.style.display = 'none';
                                    el.style.visibility = 'hidden';
                                    hiddenCount++;
                                }
                            });
                        } catch (e) {
                            console.log('Error hiding element with selector:', selector, e);
                        }
                    });
                    
                    console.log('Hidden ' + hiddenCount + ' UI elements');
                    
                    // Force trigger data loading for the specific UWI
                    if (typeof fetchWellboreData === 'function') {
                        console.log('🔄 Triggering fetchWellboreData for UWI...');
                        try {
                            fetchWellboreData();
                        } catch (e) {
                            console.log('Error calling fetchWellboreData:', e);
                        }
                    } else {
                        console.log('⚠️ fetchWellboreData function not found');
                    }
                    
                    // Reset any applied filters to ensure proper UWI data loading
                    if (typeof resetFilter === 'function') {
                        console.log('🔄 Resetting filters to ensure UWI data loads properly...');
                        try {
                            resetFilter();
                        } catch (e) {
                            console.log('Error calling resetFilter:', e);
                        }
                    } else {
                        console.log('⚠️ resetFilter function not found');
                    }
                    
                    // Clear any input filters that might interfere - WITH NULL CHECKING
                    const filterSelectors = ['#filterTopMd', '#filterBotMd', '#filterIconName'];
                    filterSelectors.forEach(selector => {
                        try {
                            const input = document.querySelector(selector);
                            if (input && input.value !== undefined) {
                                input.value = '';
                                console.log('Cleared filter input:', selector);
                            } else if (input) {
                                console.log('Input found but no value property:', selector);
                            } else {
                                console.log('Input not found:', selector);
                            }
                        } catch (e) {
                            console.log('Error clearing filter input:', selector, e);
                        }
                    });
                    
                    // Check if UWI-specific data is loaded
                    const currentUWI = document.querySelector('#currentUWI, .current-uwi, [data-uwi]');
                    const uwiInfo = currentUWI ? currentUWI.textContent || currentUWI.value : 'Not found';
                    console.log('Current UWI in page:', uwiInfo);
                    
                    return {
                        success: true, 
                        message: 'UI elements hidden and UWI data loading ensured',
                        uwi: uwiInfo,
                        hiddenElements: hiddenCount
                    };
                    
                } catch (error) {
                    console.error('Error in script execution:', error);
                    return {success: false, error: error.message};
                }
            """)
            
            print(f"📋 Script execution result: {script_result}")
            
            # Additional wait for complete rendering after script execution
            print("⏳ Additional wait for complete rendering...")
            time.sleep(8)
            
            # Check data loading with better error handling
            svg_check_result = driver.execute_script("""
                try {
                    const svg = document.getElementById('wellbore');
                    if (!svg) {
                        return {success: false, error: 'SVG element not found'};
                    }
                    
                    const images = svg.querySelectorAll('image');
                    const texts = svg.querySelectorAll('text');
                    const lines = svg.querySelectorAll('line');
                    const rects = svg.querySelectorAll('rect');
                    const paths = svg.querySelectorAll('path');
                    
                    console.log(`📊 SVG content: ${images.length} images, ${texts.length} texts, ${lines.length} lines, ${rects.length} rects, ${paths.length} paths`);
                    
                    // Check for UWI-specific content
                    const textContent = Array.from(texts).map(t => t.textContent).join(' ');
                    const hasUWIContent = textContent.length > 0;
                    
                    return {
                        success: true,
                        images: images.length,
                        texts: texts.length,
                        lines: lines.length,
                        rects: rects.length,
                        paths: paths.length,
                        svgContent: svg.innerHTML.length,
                        hasContent: hasUWIContent,
                        contentPreview: textContent.substring(0, 100)
                    };
                } catch (error) {
                    return {success: false, error: error.message};
                }
            """)
            
            print(f"📊 SVG check result: {svg_check_result}")
            
            # Capture ONLY the wellbore SVG element (no UI elements)
            screenshot = None
            screenshot_method = ""
            
            try:
                # Method 1: Capture only the wellbore SVG element
                print(f"📷 Attempting to capture wellbore SVG for {uwi}...")
                wellbore_svg = driver.find_element(By.ID, "wellbore")
                screenshot = wellbore_svg.screenshot_as_png
                screenshot_method = "wellbore-svg-only"
                print(f"✅ Screenshot captured: wellbore SVG only for {uwi}")
            except Exception as e:
                print(f"❌ Wellbore SVG screenshot failed for {uwi}: {e}")
                try:
                    # Method 2: Try diagram container without buttons
                    print(f"📷 Attempting to capture diagram container for {uwi}...")
                    diagram_container = driver.find_element(By.ID, "diagram-container")
                    screenshot = diagram_container.screenshot_as_png
                    screenshot_method = "diagram-container"
                    print(f"✅ Screenshot captured: diagram-container for {uwi}")
                except Exception as e2:
                    print(f"❌ Diagram container screenshot failed for {uwi}: {e2}")
                    # Method 3: Full page as last resort
                    print(f"📷 Attempting full page screenshot for {uwi}...")
                    screenshot = driver.get_screenshot_as_png()
                    screenshot_method = "full-page"
                    print(f"✅ Screenshot captured: full-page for {uwi}")
            
            if not screenshot:
                raise Exception(f"Failed to capture screenshot for {uwi} with any method")
            
            # Convert to base64
            screenshot_base64 = base64.b64encode(screenshot).decode('utf-8')
            print(f"✅ Screenshot converted to base64 for {uwi}, size: {len(screenshot_base64)} chars")
            
            return jsonify({
                "success": True,
                "image": screenshot_base64,
                "format": "png",
                "url": url,
                "uwi": uwi,
                "method": f"selenium-{screenshot_method}",
                "svg_stats": svg_check_result,
                "script_result": script_result,
                "viewport": {"width": width, "height": height},
                "filters": {
                    "top_md": top_md,
                    "bot_md": bot_md,
                    "icon_name": icon_name
                },
                "notes": f"Wellbore diagram for {uwi}, SVG only, no UI elements"
            }), 200
            
        finally:
            if driver:
                driver.quit()
                print(f"🔚 Chrome driver closed for {uwi}")
            
    except Exception as e:
        print(f"❌ Error generating screenshot: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": str(e),
            "method": "selenium",
            "uwi": data.get('uwi', 'Unknown'),
            "traceback": traceback.format_exc()
        }), 500

# Menjalankan server
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8181)