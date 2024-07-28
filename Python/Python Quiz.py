print('Welcome to AskPython Quiz')
answer = input('Are you ready to play the Quiz? (yes/no): ')

if answer.lower() == 'yes':
    score = 0
    total_questions = 3

    answer = input('Question 1: What is your favorite programming language? ')
    if answer.lower() == 'python':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 2: Who played football in Real Madrid in the 2014 season?')
    if answer.lower() == 'C.Ronaldo':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')
  
  # Add more questions here...

    print(f'Thank you for playing! You attempted {score} questions correctly.')
    mark = (score / total_questions) * 100
    print(f'Marks obtained: {mark:.1f}%')
else:
    print('Goodbye!')
