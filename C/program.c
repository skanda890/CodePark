#include <stdio.h>
#include <stdlib.h>

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
    char input[256];

    while (1) {
        printf("Enter a positive integer: ");
        if (fgets(input, sizeof(input), stdin) != NULL) {
            // Check if the input is a valid integer
            char *endptr;
            num = strtol(input, &endptr, 10);
            if (endptr == input || *endptr != '\n') {
                printf("Invalid input. Please enter a valid positive integer.\n");
                continue;
            }

            if (num < 0) {
                printf("Factorial is not defined for negative numbers.\n");
            } else {
                unsigned long long result = factorial(num);
                printf("Factorial of %d = %llu\n", num, result);
                break;
            }
        }
    }

    // Wait for user input before closing
    printf("Press Enter to close the program...");
    getchar(); // Wait for the user to press Enter

    return 0;
}
