import math
import time

# ==========================================
# PART 1: THE RADICAL FILTER
# ==========================================
def get_primes_up_to(limit):
    """Finds all prime numbers up to the square root limit."""
    primes = []
    for num in range(2, limit + 1):
        is_prime = True
        for p in primes:
            if p * p > num:
                break
            if num % p == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return primes

def radical_filter(candidate):
    """
    Skanda's Radical Filter: x ⊥ rad(⌊√x⌋!)
    Checks if the candidate is coprime to the Radical bundle.
    """
    if candidate < 2: return False
    
    limit = math.isqrt(candidate)
    
    primes = get_primes_up_to(limit)
    radical_bundle = 1
    for p in primes:
        radical_bundle *= p
        
    if math.gcd(candidate, radical_bundle) == 1:
        return True
    else:
        return False

# ==========================================
# PART 2: THE GEARBOX & ELEVATION LOOP
# ==========================================
def skandas_prime_engine(x):
    n = 0
    gear = math.ceil(x / 20)
    if gear == 0: gear = 1 
    
    while True:
        multiplier = 2 * (gear + n) * x
        
        cand_minus = multiplier - 1
        if cand_minus > 1 and radical_filter(cand_minus):
            return cand_minus, n, "-1"
            
        cand_plus = multiplier + 1
        if cand_plus > 1 and radical_filter(cand_plus):
            return cand_plus, n, "+1"
            
        n += 1 

# ==========================================
# THE TEST: INFINITE MODE
# ==========================================
print("--- FIRING UP THE PRIME ENGINE (INFINITE MODE) ---")
print("The engine is running! Press Ctrl + C to stop it.\n")

time.sleep(2) # Gives you 2 seconds to read the message before it blasts off

x = 1
try:
    while True:
        prime, level, sign = skandas_prime_engine(x)
        gear = math.ceil(x/20) if x > 0 else 1
        
        print(f"Input: {x:<6} | Gear: {gear:<4} | Level (n): {level:<2} | Prime Found: {prime:<10} (using {sign})")
        
        x += 1
        
        # Optional: Un-comment the line below if it's printing too fast to read!
        # time.sleep(0.05) 

except KeyboardInterrupt:
    # This triggers when you press Ctrl + C
    print("\n\n--- ENGINE SHUT DOWN BY SKANDA ---")
    print(f"Highest input reached before shutdown: x = {x - 1}")
