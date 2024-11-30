import cohere

API_KEY = "eDAnbz2p04jnwpkyNoTjspF9yd8DrP0ebFU7IT1M"

co = cohere.Client(API_KEY)

text="""The global climate is changing at an unprecedented rate due to human activities. Over the past century, industrialization and deforestation have significantly contributed to an increase in greenhouse gases, such as carbon dioxide and methane, in the atmosphere. These gases trap heat, leading to a phenomenon known as global warming. The effects of global warming are far-reaching, impacting weather patterns, sea levels, and biodiversity.

One of the most visible impacts is the melting of polar ice caps and glaciers, resulting in rising sea levels. This poses a threat to coastal communities and island nations, which face increased risks of flooding and displacement. Additionally, extreme weather events such as hurricanes, droughts, and wildfires have become more frequent and severe.

Efforts to mitigate climate change include transitioning to renewable energy sources, such as solar and wind, reducing carbon emissions, and reforestation. International agreements like the Paris Accord aim to unite nations in combating this global issue. However, individual actions, such as conserving energy, reducing waste, and advocating for policy changes, also play a critical role."""


# response = co.summarize( text
#         length="medium"
# )

response = co.chat(message= f"Generate a concise summary of this text as bullet points\n{text}").text

print(response)

# Convert the summary to bullet points
# summary = response.summary
# bullet_summary = "\n".join([f"- {line.strip()}" for line in summary.split('. ') if line])



