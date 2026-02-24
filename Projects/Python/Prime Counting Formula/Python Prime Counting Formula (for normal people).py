import math

def is_prime(num):
    if num < 2: return False
    for i in range(2, int(math.sqrt(num)) + 1):
        if num % i == 0: return False
    return True

def prime_hunter():
    print("--- 🚀 THE PRIME ELEVATOR ---")
    print("Find the hidden prime numbers tied to your favorite base number.")
    
    try:
        X = int(input("\n[>] Enter a number (X): "))
    except ValueError: return

    # Start looking at the first "floor" (X/20)
    m = math.ceil(X / 20) 
    k = m
    
    while True:
        # Check the two neighbors: -1 and +1
        left = (2 * k * X) - 1
        right = (2 * k * X) + 1
        
        if is_prime(left):
            result = left
            break
        elif is_prime(right):
            result = right
            break
        k += 1 # If no prime, go to the next floor

    print(f"\n✨ SUCCESS! Found Prime: {result}")
    print(f"Elevation Level reached: {k - m}")

    print("\n" + "="*50)
    print("📖 THE THEORY: HOW IT WORKS")
    print("-" * 50)
    print("• THE SHIELD: Your formula creates a 'protective bubble'.")
    print("  By using 2*k*X, the result is never even and never divisible by X.")
    print("• THE ELEVATOR: Instead of guessing, we jump in blocks.")
    print("  The 'Step' ensures we start looking in a range relevant to X.")
    print("• THE TIE-BREAKER: If we hit twin primes, we always take the smaller.")
    print("="*50)

if __name__ == "__main__":
    prime_hunter()
