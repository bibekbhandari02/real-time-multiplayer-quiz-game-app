import Question from '../models/Question.js';

const sampleQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "easy",
    explanation: "Paris is the capital and most populous city of France."
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "easy",
    explanation: "Mars is called the Red Planet due to its reddish appearance caused by iron oxide on its surface."
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art",
    difficulty: "easy",
    explanation: "Leonardo da Vinci painted the Mona Lisa in the early 16th century."
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: 3,
    category: "Geography",
    difficulty: "easy",
    explanation: "The Pacific Ocean is the largest and deepest ocean on Earth."
  },
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History",
    difficulty: "medium",
    explanation: "World War II ended in 1945 with the surrender of Japan in September."
  },
  {
    question: "What is the speed of light in vacuum?",
    options: ["299,792 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    correctAnswer: 0,
    category: "Science",
    difficulty: "medium",
    explanation: "The speed of light in vacuum is approximately 299,792 kilometers per second."
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1,
    category: "Literature",
    difficulty: "easy",
    explanation: "William Shakespeare wrote the tragedy Romeo and Juliet around 1594-1596."
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    category: "Science",
    difficulty: "medium",
    explanation: "Au is the chemical symbol for gold, derived from the Latin word 'aurum'."
  },
  {
    question: "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: 2,
    category: "Technology",
    difficulty: "easy",
    explanation: "JavaScript is known as the language of the web as it runs in all web browsers."
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correctAnswer: 2,
    category: "Mathematics",
    difficulty: "easy",
    explanation: "2 is the smallest prime number and the only even prime number."
  },
  {
    question: "Who developed the theory of relativity?",
    options: ["Isaac Newton", "Albert Einstein", "Stephen Hawking", "Niels Bohr"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "easy",
    explanation: "Albert Einstein developed the theory of relativity in the early 20th century."
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    category: "Biology",
    difficulty: "easy",
    explanation: "The Blue Whale is the largest mammal and the largest animal ever known to have existed."
  },
  {
    question: "In which country would you find the Great Barrier Reef?",
    options: ["Brazil", "Australia", "Indonesia", "Philippines"],
    correctAnswer: 1,
    category: "Geography",
    difficulty: "easy",
    explanation: "The Great Barrier Reef is located off the coast of Queensland, Australia."
  },
  {
    question: "What does CPU stand for?",
    options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"],
    correctAnswer: 0,
    category: "Technology",
    difficulty: "easy",
    explanation: "CPU stands for Central Processing Unit, the primary component of a computer that performs instructions."
  },
  {
    question: "Who was the first person to walk on the moon?",
    options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
    correctAnswer: 1,
    category: "History",
    difficulty: "easy",
    explanation: "Neil Armstrong was the first person to walk on the moon on July 20, 1969."
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctAnswer: 2,
    category: "Science",
    difficulty: "easy",
    explanation: "Diamond is the hardest naturally occurring substance on Earth."
  },
  {
    question: "Which gas do plants absorb from the atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correctAnswer: 2,
    category: "Biology",
    difficulty: "easy",
    explanation: "Plants absorb carbon dioxide from the atmosphere during photosynthesis."
  },
  {
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "easy",
    explanation: "Tokyo is the capital city of Japan and one of the world's most populous cities."
  },
  {
    question: "Who invented the telephone?",
    options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Benjamin Franklin"],
    correctAnswer: 1,
    category: "History",
    difficulty: "medium",
    explanation: "Alexander Graham Bell is credited with inventing the telephone in 1876."
  },
  {
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    category: "Mathematics",
    difficulty: "easy",
    explanation: "The square root of 144 is 12, as 12 × 12 = 144."
  }
];

export const seedQuestions = async () => {
  try {
    const count = await Question.countDocuments();
    
    if (count === 0) {
      await Question.insertMany(sampleQuestions);
      console.log('✅ Seeded 20 sample questions');
    } else {
      console.log(`ℹ️  Database already has ${count} questions`);
    }
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
  }
};
