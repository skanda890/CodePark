import math

class PrimeSieve:
    @staticmethod
    def check(n):
        if n < 2: return False
        if n in (2, 3): return True
        if n % 2 == 0 or n % 3 == 0: return False
        for i in range(5, int(n**0.5) + 1, 6):
            if n % i == 0 or n % (i + 2) == 0: return False
        return True

    def solve(self, X):
        # Step Boundary: m >= ceil(X/20)
        m_start = math.ceil(X / 20)
        k = m_start
        
        while True:
            # Candidate set S = {2kX - 1, 2kX + 1}
            candidates = [(2 * k * X) - 1, (2 * k * X) + 1]
            primes = [p for p in candidates if self.check(p)]
            
            if primes:
                # P = min(S intersect Primes)
                return min(primes), k
            k += 1

def main():
    print("--- 📐 FORMAL PARAMETRIC ANALYSIS ---")
    X = int(input("Define Domain Parameter X: "))
    
    engine = PrimeSieve()
    P, k_star = engine.solve(X)
    
    print(f"\nCONVERGENCE: P = {P} at k* = {k_star}")

    print("\n" + "="*60)
    print("📐 FORMAL THEORY: THE ADAPTIVE SIEVE")
    print("-" * 60)
    print("• RESIDUE CLASSES: Candidates are restricted to P ≡ ±1 (mod 2X).")
    print("  Since gcd(±1, 2X) = 1, Dirichlet’s Theorem guarantees prime density.")
    print("• PARAMETRIC MINIMIZATION: P is the infimum of the set intersection.")
    print("  k is the minimal integer m where (2mX ± 1) ∩ ℙ is non-empty.")
    print("• COPRIMALITY: The mapping ensures P is coprime to X (gcd(P, X) = 1).")
    print("="*60)

if __name__ == "__main__":
    main()
