import requests
import time
import os
import ctypes
import json
import hashlib
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
DRIVE_PATH = "A:\\Pi.txt"
META_PATH = "A:\\Pi_Metadata.json" 
COMET_PATH = r"C:\Program Files\Comet\Browser\Comet.exe" # Path to Comet browser
API_URL = "https://api.pi.delivery/v1/pi"
CHUNK_SIZE = 100000      # 1 Lakh digits per API call
LAKH = 100000            # Validation Milestone
TRILLION = 10**12        # 1,000,000,000,000

class PiTitan:
    def __init__(self):
        self.session = requests.Session()
        self.current_pos = self.load_state()
        self.desmos_seed = ""

    def get_seed_silently(self):
        """Launches Comet in the background to get Desmos 15-digit Pi."""
        options = Options()
        options.binary_location = COMET_PATH
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        
        try:
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            driver.get("https://www.desmos.com/calculator")
            time.sleep(4)
            expr = driver.find_element(By.CLASS_NAME, "dcg-mq-editable-field")
            expr.send_keys("4*arctan(1)")
            time.sleep(2)
            res = driver.find_element(By.CLASS_NAME, "dcg-evaluation").text
            driver.quit()
            return res.replace("= ", "").strip()
        except:
            return "3.14159265358979"

    def load_state(self):
        if os.path.exists(META_PATH):
            with open(META_PATH, "r") as f:
                return json.load(f).get("last_digit", 0)
        return max(0, os.path.getsize(DRIVE_PATH) - 2) if os.path.exists(DRIVE_PATH) else 0

    def save_state(self):
        with open(META_PATH, "w") as f:
            json.dump({"last_digit": self.current_pos, "time": time.time()}, f)

    def fetch_block(self, start, count):
        for _ in range(3): # Retry logic
            try:
                r = self.session.get(API_URL, params={'start': start, 'numberOfDigits': count}, timeout=25)
                if r.status_code == 200: return r.json().get("content", "")
            except: time.sleep(5)
        return None

    def validate(self):
        """Cross-checks the last 1 Lakh digits for any corruption."""
        if self.current_pos < LAKH: return True
        start = self.current_pos - LAKH
        truth = self.fetch_block(start, LAKH)
        with open(DRIVE_PATH, "r") as f:
            f.seek(start + 2)
            local = f.read(LAKH)
        return hashlib.md5(local.encode()).hexdigest() == hashlib.md5(truth.encode()).hexdigest()

    def run(self):
        print(f"[SYSTEM] Performing silent Comet/Desmos handshake...")
        self.desmos_seed = self.get_seed_silently()
        
        if not os.path.exists(DRIVE_PATH):
            with open(DRIVE_PATH, "w") as f: f.write("3.")
            
        print(f"Resuming at {self.current_pos:,} digits. Target: 1 Trillion.")

        while self.current_pos < TRILLION:
            data = self.fetch_block(self.current_pos, CHUNK_SIZE)
            if data:
                with open(DRIVE_PATH, "a") as f:
                    f.write(data)
                    f.flush()
                
                self.current_pos += len(data)
                
                # Check accuracy against Comet for the very first block
                if self.current_pos == CHUNK_SIZE and data[:10] != self.desmos_seed[2:12]:
                    print("\n[!] WARNING: Seed mismatch between Desmos and API.")

                # Every 1 Lakh: Validate & Save
                if self.current_pos % LAKH == 0:
                    if not self.validate():
                        print(f"\n[!] Error at {self.current_pos}. Repairing...")
                        self.current_pos -= LAKH
                        with open(DRIVE_PATH, "rb+") as f: f.truncate(self.current_pos + 2)
                    self.save_state()

                print(f"\rStreaming: {self.current_pos:,} / {TRILLION:,}", end="")
            else:
                print("\n[!] Network lag. Retrying...")

        ctypes.windll.user32.MessageBoxW(0, "Task Complete: Pi reached 1 Trillion.", "Success", 0x40)

if __name__ == "__main__":
    PiTitan().run()
