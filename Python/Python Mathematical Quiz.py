print('Welcome to AskPython Quiz')
answer = input('Are you ready to play the Quiz? (yes/no): ')

if answer.lower() == 'yes':
    score = 0
    total_questions = 5

    answer = input('Question 1: What is 5 + 7? ')
    if answer == '12':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 2: What is the square root of 64? ')
    if answer == '8':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 3: What is 15 * 3? ')
    if answer == '45':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 4: What is 100 divided by 4? ')
    if answer == '25':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 5: What is the factorial of 5? ')
    if answer == '120':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    print(f'Thank you for playing! You attempted {score} questions correctly.')
    mark = (score / total_questions) * 100
    print(f'Marks obtained: {mark:.1f}%')
else:
    print('Goodbye!')

input('Press Enter to exit')
