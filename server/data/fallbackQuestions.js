// Fallback question bank for when Gemini API is unavailable
export const fallbackQuestions = {
  'General Knowledge': [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
      explanation: "Paris is the capital and largest city of France, known for the Eiffel Tower and rich cultural heritage.",
      difficulty: "easy",
      category: "General Knowledge"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
      explanation: "Mars is called the Red Planet due to iron oxide (rust) on its surface, giving it a reddish appearance.",
      difficulty: "easy",
      category: "General Knowledge"
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      correctAnswer: 2,
      explanation: "Leonardo da Vinci painted the Mona Lisa in the early 16th century. It's one of the most famous paintings in the world.",
      difficulty: "easy",
      category: "General Knowledge"
    },
    {
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: 3,
      explanation: "The Pacific Ocean is the largest and deepest ocean, covering more than 30% of Earth's surface.",
      difficulty: "easy",
      category: "General Knowledge"
    },
    {
      question: "How many continents are there?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 2,
      explanation: "There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Australia/Oceania, and South America.",
      difficulty: "easy",
      category: "General Knowledge"
    },
    {
      question: "What is the smallest country in the world?",
      options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
      correctAnswer: 1,
      explanation: "Vatican City is the smallest country, covering only 0.44 square kilometers within Rome, Italy.",
      difficulty: "medium",
      category: "General Knowledge"
    },
    {
      question: "In what year did World War II end?",
      options: ["1943", "1944", "1945", "1946"],
      correctAnswer: 2,
      explanation: "World War II ended in 1945 with Germany's surrender in May and Japan's surrender in September.",
      difficulty: "medium",
      category: "General Knowledge"
    },
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
      explanation: "Au is the chemical symbol for gold, derived from the Latin word 'aurum' meaning gold.",
      difficulty: "medium",
      category: "General Knowledge"
    },
    {
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: 1,
      explanation: "William Shakespeare wrote Romeo and Juliet around 1594-1596, one of his most famous tragic plays.",
      difficulty: "easy",
      category: "General Knowledge"
    },
    {
      question: "What is the speed of light?",
      options: ["299,792 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
      correctAnswer: 0,
      explanation: "The speed of light in a vacuum is approximately 299,792 kilometers per second.",
      difficulty: "hard",
      category: "General Knowledge"
    }
  ],
  'Science': [
    {
      question: "What is the chemical formula for water?",
      options: ["H2O", "CO2", "O2", "H2O2"],
      correctAnswer: 0,
      explanation: "Water's chemical formula is H2O, consisting of two hydrogen atoms and one oxygen atom.",
      difficulty: "easy",
      category: "Science"
    },
    {
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
      correctAnswer: 2,
      explanation: "Mitochondria are known as the powerhouse of the cell because they generate most of the cell's ATP energy.",
      difficulty: "easy",
      category: "Science"
    },
    {
      question: "What is the hardest natural substance on Earth?",
      options: ["Gold", "Iron", "Diamond", "Platinum"],
      correctAnswer: 2,
      explanation: "Diamond is the hardest naturally occurring substance, rating 10 on the Mohs hardness scale.",
      difficulty: "easy",
      category: "Science"
    },
    {
      question: "How many bones are in the adult human body?",
      options: ["186", "206", "226", "246"],
      correctAnswer: 1,
      explanation: "An adult human body has 206 bones. Babies are born with about 270 bones that fuse together as they grow.",
      difficulty: "medium",
      category: "Science"
    },
    {
      question: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correctAnswer: 2,
      explanation: "Plants absorb carbon dioxide (CO2) during photosynthesis and release oxygen as a byproduct.",
      difficulty: "easy",
      category: "Science"
    },
    {
      question: "What is the most abundant gas in Earth's atmosphere?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      correctAnswer: 2,
      explanation: "Nitrogen makes up about 78% of Earth's atmosphere, while oxygen is about 21%.",
      difficulty: "medium",
      category: "Science"
    },
    {
      question: "At what temperature does water boil at sea level?",
      options: ["90°C", "100°C", "110°C", "120°C"],
      correctAnswer: 1,
      explanation: "Water boils at 100°C (212°F) at sea level under standard atmospheric pressure.",
      difficulty: "easy",
      category: "Science"
    },
    {
      question: "What is the center of an atom called?",
      options: ["Electron", "Proton", "Neutron", "Nucleus"],
      correctAnswer: 3,
      explanation: "The nucleus is the center of an atom, containing protons and neutrons, with electrons orbiting around it.",
      difficulty: "easy",
      category: "Science"
    },
    {
      question: "What is the study of earthquakes called?",
      options: ["Meteorology", "Seismology", "Geology", "Volcanology"],
      correctAnswer: 1,
      explanation: "Seismology is the scientific study of earthquakes and the propagation of elastic waves through the Earth.",
      difficulty: "medium",
      category: "Science"
    },
    {
      question: "What particle in an atom has a negative charge?",
      options: ["Proton", "Neutron", "Electron", "Photon"],
      correctAnswer: 2,
      explanation: "Electrons carry a negative charge, while protons are positive and neutrons are neutral.",
      difficulty: "easy",
      category: "Science"
    }
  ],
  'History': [
    {
      question: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
      correctAnswer: 1,
      explanation: "George Washington served as the first President of the United States from 1789 to 1797.",
      difficulty: "easy",
      category: "History"
    },
    {
      question: "In which year did the Titanic sink?",
      options: ["1910", "1911", "1912", "1913"],
      correctAnswer: 2,
      explanation: "The RMS Titanic sank on April 15, 1912, after hitting an iceberg during its maiden voyage.",
      difficulty: "medium",
      category: "History"
    },
    {
      question: "Who was the ancient Egyptian queen known for her beauty?",
      options: ["Nefertiti", "Cleopatra", "Hatshepsut", "Nefertari"],
      correctAnswer: 1,
      explanation: "Cleopatra VII was the last active ruler of ancient Egypt, famous for her intelligence and beauty.",
      difficulty: "easy",
      category: "History"
    },
    {
      question: "What year did World War I begin?",
      options: ["1912", "1913", "1914", "1915"],
      correctAnswer: 2,
      explanation: "World War I began in 1914 and lasted until 1918, involving many of the world's great powers.",
      difficulty: "medium",
      category: "History"
    },
    {
      question: "Who built the Great Wall of China?",
      options: ["Ming Dynasty", "Qin Dynasty", "Han Dynasty", "Tang Dynasty"],
      correctAnswer: 1,
      explanation: "The Qin Dynasty under Emperor Qin Shi Huang began building the Great Wall around 221 BC.",
      difficulty: "medium",
      category: "History"
    },
    {
      question: "What was the name of the ship that brought the Pilgrims to America?",
      options: ["Santa Maria", "Mayflower", "Beagle", "Victoria"],
      correctAnswer: 1,
      explanation: "The Mayflower brought the Pilgrims to Plymouth, Massachusetts in 1620.",
      difficulty: "easy",
      category: "History"
    },
    {
      question: "Who discovered America in 1492?",
      options: ["Amerigo Vespucci", "Christopher Columbus", "Ferdinand Magellan", "Vasco da Gama"],
      correctAnswer: 1,
      explanation: "Christopher Columbus reached the Americas in 1492, though Vikings had arrived centuries earlier.",
      difficulty: "easy",
      category: "History"
    },
    {
      question: "What ancient wonder was located in Alexandria?",
      options: ["Hanging Gardens", "Colossus", "Lighthouse", "Mausoleum"],
      correctAnswer: 2,
      explanation: "The Lighthouse of Alexandria (Pharos) was one of the Seven Wonders of the Ancient World.",
      difficulty: "hard",
      category: "History"
    },
    {
      question: "Who was the first man to walk on the moon?",
      options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
      correctAnswer: 1,
      explanation: "Neil Armstrong became the first person to walk on the moon on July 20, 1969.",
      difficulty: "easy",
      category: "History"
    },
    {
      question: "What empire was ruled by Julius Caesar?",
      options: ["Greek Empire", "Roman Empire", "Persian Empire", "Ottoman Empire"],
      correctAnswer: 1,
      explanation: "Julius Caesar was a Roman military and political leader who played a critical role in the Roman Empire.",
      difficulty: "easy",
      category: "History"
    }
  ],
  'Technology': [
    {
      question: "Who is known as the father of computers?",
      options: ["Steve Jobs", "Bill Gates", "Charles Babbage", "Alan Turing"],
      correctAnswer: 2,
      explanation: "Charles Babbage designed the first mechanical computer, the Analytical Engine, in the 1830s.",
      difficulty: "medium",
      category: "Technology"
    },
    {
      question: "What does CPU stand for?",
      options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"],
      correctAnswer: 0,
      explanation: "CPU stands for Central Processing Unit, the primary component that executes instructions in a computer.",
      difficulty: "easy",
      category: "Technology"
    },
    {
      question: "What year was the first iPhone released?",
      options: ["2005", "2006", "2007", "2008"],
      correctAnswer: 2,
      explanation: "Apple released the first iPhone on June 29, 2007, revolutionizing the smartphone industry.",
      difficulty: "medium",
      category: "Technology"
    },
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
      correctAnswer: 0,
      explanation: "HTML stands for Hyper Text Markup Language, the standard language for creating web pages.",
      difficulty: "easy",
      category: "Technology"
    },
    {
      question: "Who founded Microsoft?",
      options: ["Steve Jobs", "Bill Gates and Paul Allen", "Mark Zuckerberg", "Larry Page"],
      correctAnswer: 1,
      explanation: "Bill Gates and Paul Allen founded Microsoft in 1975, which became the world's largest software company.",
      difficulty: "easy",
      category: "Technology"
    },
    {
      question: "What does USB stand for?",
      options: ["Universal Serial Bus", "United System Bus", "Universal System Board", "United Serial Board"],
      correctAnswer: 0,
      explanation: "USB stands for Universal Serial Bus, a standard for connecting devices to computers.",
      difficulty: "easy",
      category: "Technology"
    },
    {
      question: "What programming language is known for its use in web development?",
      options: ["Python", "JavaScript", "C++", "Java"],
      correctAnswer: 1,
      explanation: "JavaScript is the primary programming language for web development, running in all modern browsers.",
      difficulty: "easy",
      category: "Technology"
    },
    {
      question: "What does AI stand for?",
      options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Integration", "Automated Integration"],
      correctAnswer: 1,
      explanation: "AI stands for Artificial Intelligence, the simulation of human intelligence by machines.",
      difficulty: "easy",
      category: "Technology"
    },
    {
      question: "Who founded Tesla Motors?",
      options: ["Elon Musk", "Martin Eberhard and Marc Tarpenning", "Steve Jobs", "Jeff Bezos"],
      correctAnswer: 1,
      explanation: "Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003, with Elon Musk joining as chairman.",
      difficulty: "hard",
      category: "Technology"
    },
    {
      question: "What does RAM stand for?",
      options: ["Random Access Memory", "Read Access Memory", "Rapid Access Memory", "Remote Access Memory"],
      correctAnswer: 0,
      explanation: "RAM stands for Random Access Memory, temporary storage that computers use to hold data being processed.",
      difficulty: "easy",
      category: "Technology"
    }
  ]
};

// Get random questions from fallback bank
export const getFallbackQuestions = (category, count = 10) => {
  const categoryQuestions = fallbackQuestions[category] || fallbackQuestions['General Knowledge'];
  
  // Shuffle and return requested number of questions
  const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
