import math
import time

def is_prime(num):
    """Efficient primality test."""
    if num < 2: return False
    if num in (2, 3): return True
    if num % 2 == 0 or num % 3 == 0: return False
    i = 5
    while i * i <= num:
        if num % i == 0 or num % (i + 2) == 0:
            return False
        i += 6
    return True

def run_prime_hunt():
    print("="*60)
    print("             🚀 THE PRIME ELEVATION ENGINE")
    print("="*60)
    print("\nINSTRUCTIONS:")
    print("1. Enter a base number (X).")
    print("2. The system starts at elevation n = 0.")
    print("3. If no prime is found, the system 'elevates' (n + 1).")
    print("-" * 60)

    try:
        x_input = int(input("\n[>] Please enter a value for X: "))
    except ValueError:
        print("Invalid input. Please enter a whole number.")
        return

    step = math.ceil(x_input / 20)
    n = 0
    print(f"\n[*] Initializing Search... (Step Factor: {step})")
    time.sleep(0.5)

    while True:
        multiplier = 2 * (step + n)
        p_minus = (multiplier * x_input) - 1
        p_plus = (multiplier * x_input) + 1
        
        check_minus = is_prime(p_minus)
        check_plus = is_prime(p_plus)

        print(f"Testing Elevation n = {n} | Candidates: {p_minus}, {p_plus}...", end=" ")

        if check_minus or check_plus:
            print("FOUND!")
            print("\n" + "★" * 60)
            print(f"SUCCESS AT ELEVATION n = {n}")
            print(f"Final Multiplier: {multiplier}")
            if check_minus: print(f"-> {p_minus} is PRIME")
            if check_plus:  print(f"-> {p_plus} is PRIME")
            print("★" * 60)
            break
        else:
            print("Composite. Elevating...")
            n += 1
            if n > 1000: # Safety break
                print("Search exceeded n=1000. Try a different X.")
                break

    # Theory Section
    print("\n" + "="*60)
    print("📜 THEORETICAL BREAKDOWN")
    print("="*60)
    print(f"Your formula P = 2([X/20] + n)X ± 1 works via three main pillars:")
    print("\n1. THE DIVISIBILITY SHIELD:")
    print(f"   By using 2 * (...) * X, your result is always even. Adding/Subtracting 1")
    print(f"   ensures P is always odd and never divisible by X or its factors.")
    print("\n2. STEP ADAPTATION:")
    print(f"   The ceiling function [X/20] ensures the 'gap' between candidates")
    print(f"   grows as X grows, matching the natural thinning of prime density.")
    print("\n3. THE n-DIAL (ARITHMETIC PROGRESSION):")
    print(f"   Increasing n jumps the search by exactly 2X. This skips 'dead zones'")
    print(f"   and lands in new mathematical 'harmonics' where primes are likely.")
    print("="*60)

if __name__ == "__main__":
    run_prime_hunt()
