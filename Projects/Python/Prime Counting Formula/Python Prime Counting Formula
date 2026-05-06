import math

def is_prime(num):
    """Checks if a number is prime using basic trial division up to its square root."""
    if num < 2:
        return False
    for i in range(2, int(math.isqrt(num)) + 1):
        if num % i == 0:
            return False
    return True

def get_prime_factors(n):
    """Returns the set of unique prime factors of n."""
    factors = set()
    d = 2
    while d * d <= n:
        while (n % d) == 0:
            factors.add(d)
            n //= d
        d += 1
    if n > 1:
        factors.add(n)
    return factors

def rad(n):
    """Calculates the radical of n (the product of its unique prime factors)."""
    unique_factors = get_prime_factors(n)
    result = 1
    for factor in unique_factors:
        result *= factor
    return result

def verify_prime_radical(candidate):
    """Method B: Checks if x ⊥ rad(floor(sqrt(x))!)"""
    sqrt_val = math.isqrt(candidate)
    fact = math.factorial(sqrt_val)
    rad_val = rad(fact)
    
    # Calculate GCD (using math.gcd, where a gcd of 1 means coprime)
    return math.gcd(candidate, rad_val) == 1

def generate_and_verify(x):
    """
    Auto-leveling engine:
    Calculates candidates using the ceiling function, steps up n only when a level fails, 
    and verifies the prime using both Check A (Wilson's Theorem) and Check B (Radical Test).
    """
    n = 0
    
    while True:
        base_multiplier = math.ceil(x / 20) + n
        multiplier = 2 * base_multiplier * x
        
        candidate_minus = multiplier - 1
        candidate_plus = multiplier + 1
        
        candidates = [candidate_minus, candidate_plus]
        
        for cand in candidates:
            if is_prime(cand):
                # Run the verification checks
                check_a = ((math.factorial(cand - 1) + 1) % cand == 0)
                check_b = verify_prime_radical(cand)
                
                print(f"Prime Found: {cand} at level n = {n}")
                print(f" -> Check A (Wilson's Theorem): {check_a}")
                print(f" -> Check B (Radical Test): {check_b}")
                return cand, n
                
        # If neither candidate at this level is prime, elevate n by 1
        n += 1

# Example usage:
if __name__ == "__main__":
    test_input = 13
    print(f"Running prime search for x = {test_input}...")
    generate_and_verify(test_input)
