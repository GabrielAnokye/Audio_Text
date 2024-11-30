from transformers import pipeline

# Load summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Text to summarize
text = """
Artificial Intelligence is an area of computer science that emphasizes the creation of intelligent machines 
that work and react like humans. Some of the activities computers with artificial intelligence are designed 
for include: Speech recognition, Learning, Planning, Problem-solving. Artificial Intelligence is the 
simulation of human intelligence processes by machines, especially computer systems. These processes include 
learning (the acquisition of information and rules for using the information), reasoning (using rules to 
reach approximate or definite conclusions), and self-correction. Particular applications of AI include 
expert systems, speech recognition, and machine vision.
"""

# Generate summary
summary = summarizer(text, max_length=100, min_length=30, do_sample=False)

print("Summary:")
print(summary[0]['summary_text'])
