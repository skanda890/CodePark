import math

def find_prime_elevation(X):
    """
    Finds primes using the formula: P = 2 * (ceil(X/20) + n) * X ± 1
    """
    def is_prime(num):
        if num < 2: return False
        for i in range(2, int(math.sqrt(num)) + 1):
            if num % i == 0: return False
        return True

    step = math.ceil(X / 20)
    n = 0
    
    while True:
        # The Multiplier: 2 * (Step + n)
        multiplier = 2 * (step + n)
        
        # Calculate candidates
        p_minus = (multiplier * X) - 1
        p_plus = (multiplier * X) + 1
        
        # Check for primes
        check_minus = is_prime(p_minus)
        check_plus = is_prime(p_plus)
        
        if check_minus or check_plus:
            return {
                "X": X,
                "n_elevation": n,
                "multiplier": multiplier,
                "results": {
                    "P_minus": (p_minus, "PRIME" if check_minus else "composite"),
                    "P_plus": (p_plus, "PRIME" if check_plus else "composite")
                }
            }
        
        # If neither is prime, elevate n and loop again
        n += 1
