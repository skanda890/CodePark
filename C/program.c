#include <stdio.h>

// Function to calculate the factorial
unsigned long long factorial(int n) {
    if (n == 0 || n == 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

int main() {
    int num;
    printf("Enter a positive integer: ");
    scanf("%d", &num);

    if (num < 0) {
        printf("Factorial is not defined for negative numbers.\n");
    } else {
        unsigned long long result = factorial(num);
        printf("Factorial of %d = %llu\n", num, result);
    }

    // Wait for user input before closing
    printf("Press Enter to close the program...");
    getchar(); // Consume the newline character left by scanf
    getchar(); // Wait for the user to press Enter

    return 0;
}
