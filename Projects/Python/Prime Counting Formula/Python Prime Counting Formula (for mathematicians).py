import math

class PrimeElevationSieve:
    """
    An implementation of a targeted primality search algorithm.
    Utilizes an adaptive step function and parametric elevation (n)
    to identify primes in the form P ≡ ±1 (mod 2kX).
    """

    @staticmethod
    def is_prime(m):
        if m < 2: return False
        if m % 2 == 0 or m % 3 == 0: return m in (2, 3)
        for i in range(5, int(m**0.5) + 1, 6):
            if m % i == 0 or m % (i + 2) == 0: return False
        return True

    def hunt(self, X):
        print(f"\n[RESEARCH LOG] Analyzing Base X = {X}")
        print("-" * 50)
        
        # Define the adaptive step: s = ⌈X/20⌉
        s = math.ceil(X / 20)
        n = 0
        
        while True:
            # Multiplier k = 2(s + n)
            k = 2 * (s + n)
            candidates = [k * X - 1, k * X + 1]
            
            results = [self.is_prime(p) for p in candidates]
            
            print(f"Iteration n={n}: Testing P ≡ ±1 (mod {k*X}) -> {candidates}")
            
            if any(results):
                return n, k, candidates, results
            n += 1

def main():
    print("NUMERICAL ANALYSIS: ADAPTIVE PRIME GENERATION")
    X = int(input("Enter Domain Parameter (X): "))
    
    sieve = PrimeElevationSieve()
    n, k, candidates, results = sieve.hunt(X)
    
    print("\n" + "="*50)
    print(f"CONVERGENCE ACHIEVED AT n = {n}")
    for val, prime_status in zip(candidates, results):
        status = "PRIME (∈ ℙ)" if prime_status else "COMPOSITE"
        print(f"  P = {val} : {status}")
    print("="*50)

    print("\n[FORMAL THEORY: THE ADAPTIVE SIEVE]")
    print("1. RESIDUE CLASSES: The formula forces P ≡ ±1 (mod 2X).")
    print("   By Dirichlet's Theorem, there exist infinitely many primes")
    print("   in this progression, as gcd(±1, 2X) = 1.")
    print("\n2. COMPOSITE EXCLUSION:")
    print("   The term 2(s+n)X creates an even base, ensuring P is odd.")
    print("   Furthermore, P is coprime to X, effectively 'sieving out'")
    print("   all prime factors of X from the candidate pool.")
    print("\n3. DENSITY ADAPTATION:")
    print("   The function s = ⌈X/20⌉ accounts for the logarithmic")
    print("   distribution of primes π(x) ≈ x/ln(x), increasing the")
    print("   search interval as X moves toward infinity.")

if __name__ == "__main__":
    main()
    
