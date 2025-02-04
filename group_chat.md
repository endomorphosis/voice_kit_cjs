e... — 1/28/25, 11:23 PM
https://github.com/endomorphosis/voice_kit_webgpu_cjs
GitHub
GitHub - endomorphosis/voice_kit_webgpu_cjs
Contribute to endomorphosis/voice_kit_webgpu_cjs development by creating an account on GitHub.
GitHub - endomorphosis/voice_kit_webgpu_cjs
I know it doesn't start for a few days
https://github.com/huggingface/transformers.js-examples
GitHub
GitHub - huggingface/transformers.js-examples: A collection of 🤗 Tr...
A collection of 🤗 Transformers.js demos and example applications - huggingface/transformers.js-examples
GitHub - huggingface/transformers.js-examples: A collection of 🤗 Tr...
ATH🥭 — 1/29/25, 12:46 AM
Moonshine runs smooth as butta on my chromebook
e... — 1/29/25, 12:48 AM
yeah, i would like to get all three pieces running asr / tts / llm and maybe even retrieval with pglite
so like we can have a mini documentation for the coinbase api in the pglite database, which is retrieved into context to try to use the API to do things with
ATH🥭 — 1/29/25, 12:52 AM
will you include synthetic thinking data?
e... — 1/29/25, 12:58 AM
well, the first thing i want to check is how quickly we can asyncrhonously loop or callback between transcribing, to language generation, to text to speech.
at some time a while ago i made some code for asr that did naive volume detection
so maybe use that to interrupt generation if the person speaks, and then continue to transcribe.
and maybe maintain an audio buffer
there is several thinking models it looks like, including deepseek r1 qwen 1.5 distill 
but generally speaking you can use the optimum cli to export a model to webgpu if there is another one out there that you want to try, or that you want to finetune near the end.
but i typically dont want to fine tune as long as i can do in context learning
Lizardperson — 1/29/25, 1:33 AM
This all sounds like front end. How are we dividing labor on this?
e... — 1/29/25, 1:38 AM
ill figure it out in a few days, I dont know what everyone has going on, and I might be getting help from some guy at qualcomm on some python stuff
Lizardperson — 1/29/25, 1:40 AM
I'm working on writing the PRD and SAD for the Omni-converter and trying to get the American Legal API working.
e... — 1/29/25, 1:43 AM
okay, i dont know what PRD and SAD is, but you should focus on the american legal api stuff, and I can look at integrating the model server into the omni converter
and we can also work on the transformers js  version of the model server / endpoint demultiplexer.
i feel like with the people at Qualcomm and Intel all wanting to have effective local inference, getting a good reusable framework is key, and I think that having a small webnn based voice agent chrome extension that can be plug and played into a variety of APIs using RAG would be super useful.
in fact part of what I was doing with the embeddings, was making them so they could be searched at the edge, and retrieved into the language model context window at the edge.
Lizardperson — 1/29/25, 1:47 AM
Basically the requirements and technical design docs. Architecture.
e... — 1/29/25, 1:48 AM
oh okay
so how much javascript do you know btw.
Lizardperson — 1/29/25, 1:49 AM
Effectively zilch. I'd be totally relying on Claude, stackoverflow, and trial and error.
e... — 1/29/25, 1:50 AM
well, I consider javascript to be one of the critical languages, as it is the "language of the web", so you ought to take some time to learn it, and I think the PRD and SAD is fine to wait for now, I think focusing on both what makes money and also advances the project is the key to sustainability.
I was going to effectively make the model server the thing that converts the different modelities into the language model context anyways, so you might as well wait until i finish reworking that for CUDA / OpenVino
Lizardperson — 1/29/25, 1:52 AM
I was considering what Richard wanted (he specifically said needed that and any web APIs I could make), since Naptha, but whatever works.
e... — 1/29/25, 1:52 AM
then you will be guaranteed to have interfaces that you can program against and test that you  are getting outputs correctly.
so like for example, when parsing a pdf, there is like a pdf syntax parser which is a pain in the ass, but you can also try to parse the image of the pdfs with a vlm instead
and it sometimes captures the bar graphs, and tables a little bit better than the structured pdf xml
so like, just as I've had to write some code to chunk all of the large ass supreme court decisions, something will have to be written to chunk all of the pdf files, chunk the audio and keyframes from the video files, etc.
Lizardperson — 1/29/25, 1:54 AM
I'm hesitant about using LLMs to do PDF conversion. I tried doing that locally and I found it to be horribly inefficient. But if you can think of a more efficient way to do it.
e... — 1/29/25, 1:54 AM
and then for example, the video files need to be processed with CLAP/CLIP
i have seen packages that claim to have done it effectively.
Lizardperson — 1/29/25, 1:55 AM
Would these be arbitrary chunks or semantically connected ones?
e... — 1/29/25, 1:56 AM
semantically connected, for example if we have a textbook of ethnobotany, being able to construct a knowledge graph of all the data inside of a scanned pdf book.
and there are very good VLM based pdf deconstructors out there.
Lizardperson — 1/29/25, 1:57 AM
Do they scale?
e... — 1/29/25, 1:57 AM
I dont know if they scale, thats the thing, once you get to millions of samples, its about can you parallelize the code, and that is the extra bit that you do on top once you get the pipeline figured out.
just as how I have been converting the documents to tokens in parallel before I even run GPU on them.
also, the other reason why you should learn javascript / nodejs is because its an asyncronous event driven architecture.
this means that its better able to scale the number of requests that can be fulfilled
Golang is also a good language if you want to have something with memory management
and you can compile golang to wasm, and run it as a lambda function either in another runtime like nodejs, or line as an AWS lambda function.
Lizardperson — 1/29/25, 2:10 AM
I know I need to learn JS. Just never had the need to until now.
ATH🥭 — 1/29/25, 4:53 AM
try lovable.dev
e... — 1/29/25, 12:59 PM
https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=M3I3ZnY5NTc3amJwZjZ0Z212YTlqbjJ0YXZfMjAyNTAxMjlUMTgwMDAwWiBjX2VmOWYzZjdiYThiZDc5YTYyOGQzMGI2MjFkOWU1NjRlYjNmNDE2MDQyM2JmYWY3OWQwZTc0ZWExNDJkZThhNDlAZw&tmsrc=c_ef9f3f7ba8bd79a628d30b621d9e564eb3f4160423bfaf79d0e74ea142de8a49%40group.calendar.google.com&scp=ALL
Google Calendar - Sign in to Access & Edit Your Schedule
Access Google Calendar with a Google account (for personal use) or Google Workspace account (for business use).
ATH🥭 — 1/29/25, 6:28 PM
I'm all in. XD
Image
e... — 1/29/25, 6:30 PM
this is shitposting for sure.
do you know nodejs already ath?
ATH🥭 — 1/29/25, 6:31 PM
Yes
e... — 1/29/25, 6:33 PM
well, I think I would like to keep the interfaces in python as close as possible as in nodejs, but client js and the presentation layer is a whole other can of worms, and I have not yet even began with.
do you think the green orb motif is a good idea, or are you able to artistically manipulate it to look a little more like the coinbase logo - as seen from in a crystal ball.
and make it more like the size of a small side panel extension
e.g. here is microsoft edge
Image
so lets assume that the right panel is all the screen real estate we're going to have for whatever the front end has.
but instead all of the functionality is a local neural network model.
i still need to look at the documentation for agent kit, but I think essentially of having the "tool use" methods of having the local llm interact with an API, but I dont know what sort of auth system i will have to navigate for this coinbase agents system.
ATH🥭 — 1/29/25, 9:51 PM
This is the type of system I think should be built. One that minimizes resistance for non-technical individuals to be on boarded.
Image
ATH🥭 — 1/30/25, 12:39 AM
I like the green orb. I like whatever makes us the most money. What are we building? Is everything still up in the air?
e... — 1/30/25, 12:41 AM
something with ASR + TTS + llm in javascript chrome extension with coinbase agent
ATH🥭 — 1/30/25, 5:58 AM
try lovable.dev
Image
Lizardperson — 1/30/25, 5:21 PM
just so you guys know, I'm sick with a fever. It's not bad enough to where I can't function but I'm definitely not at 100%
ATH🥭 — 1/30/25, 10:48 PM
I wish I could help.  I  would make you some chicken noodle soup if I could, Habibi.
ATH🥭 — 1/30/25, 11:20 PM
this is gitingest ingested by gitingest.  https://gitingest.com/cyclotruc/gitingest
Gitingest
Replace 'hub' with 'ingest' in any GitHub URL for a prompt-friendly text.
Image
ATH🥭 — 1/31/25, 4:36 PM
I have $200 in openAI credits from a hackathon I went to. We can use them on o3
e... — 1/31/25, 4:37 PM
shrug, they're better used for working on datasets, than answering chat prompts to a chrome extension
if you dont have github copilot I will pay for it for you
I am going to fix up some unit testing stuff in python today, and test a processor that came in the mail, and tomorrow I'll look at this stuff with the javascript
ATH🥭 — 1/31/25, 4:38 PM
I'll take GitHub copilot. I haven't used it since 2022
e... — 1/31/25, 4:38 PM
considering that lizardperson doesn't know javascript, so I should have python stuff he can do instead.
what have you been using?
ATH🥭 — 1/31/25, 4:39 PM
I've tried cursor, vscode extensions ... I don't like them.
e... — 1/31/25, 4:40 PM
well, are you used to doing test driven development then?
ATH🥭 — 1/31/25, 4:40 PM
Nope
Write tests before write code. Got it.
e... — 1/31/25, 4:41 PM
let me see the last thing you coded
i never actually looked at yout git account
ATH🥭 — 1/31/25, 4:42 PM
I use aider
Image
e... — 1/31/25, 4:42 PM
do you understand the idea that you have different modules written by different people, so you define the interfaces between them, and setup a testing harness so that you make sure that your inputs / outputs validate?
ATH🥭 — 1/31/25, 4:43 PM
here's my last accepted pull request.  it took me around six hours to learn how the codebase worked and implement the two changes I made https://github.com/elizaOS/eliza/pull/216
GitHub
Implement grok beta by MeDott29 · Pull Request #216 · elizaOS/eliza
grok-beta integrated.
everyone gets a free Eliza until end of year.
accelerate.
https://docs.x.ai/api/integrations#openai-sdk
Implement grok beta by MeDott29 · Pull Request #216 · elizaOS/eliza
e... — 1/31/25, 4:45 PM
hmm, that really doesn't tell me anything, but i guess what i'm trying to communicate, is that all large scale software projects need tests, because they are too large to fit in a single developers head, and that is the only way to keep consistency between the modules
ATH🥭 — 1/31/25, 4:48 PM
done. I am now a software developer that always uses TDD.
e... — 1/31/25, 4:49 PM
okay, well, what I'm hoping to get done to day, is move the testing code to a new folder, and segregate the tests based on the hardware platform e.g. qualcomm, intel, apple, nvidia, etc. https://github.com/endomorphosis/ipfs_accelerate_py/blob/main/ipfs_accelerate_py/ipfs_accelerate.py#L1505
https://github.com/endomorphosis/ipfs_accelerate_py/tree/main/test
and I will eventually use this to test all the huggingface models that are exported from pytorch to onnx, so that the onnx intermediate representation can be compiled  to webassembly / web neural networks, or openvino, or qualcomm neural network, or apple's metal platform.
so that when I go to build an electron app or docker container, it works on every platform.
and hopefully i can use some of the template skills as few shot examples, to try to let an AI agent complete the translation of the inference code for the different hardware platforms, and get as output whatever testing errors happened during the process. 
https://github.com/endomorphosis/ipfs_transformers_py/blob/main/ipfs_transformers_py/ipfs_transformers.py
GitHub
ipfs_transformers_py/ipfs_transformers_py/ipfs_transformers.py at m...
a model manager for the Transformers library, implementing S3 and IPFS downloads - endomorphosis/ipfs_transformers_py
ipfs_transformers_py/ipfs_transformers_py/ipfs_transformers.py at m...
this is what happens when you try to overload every huggingface transformers method
just to give you an idea of how many transformers classes there are
https://github.com/endomorphosis/ipfs_accelerate_py/blob/main/ipfs_accelerate_py/worker/skillset/hf_llama.py
GitHub
ipfs_accelerate_py/ipfs_accelerate_py/worker/skillset/hf_llama.py a...
Contribute to endomorphosis/ipfs_accelerate_py development by creating an account on GitHub.
ipfs_accelerate_py/ipfs_accelerate_py/worker/skillset/hf_llama.py a...
and then I need to have the corresponding "skillset" file match each transformers class and make sure that inference works on each of the classes, for all of the hardware platforms
so as you can imagine, it is possible to do by hand, but its more efficient to create a system to automate the code generation
https://github.com/endomorphosis/ipfs_transformers_py/blob/main/ipfs_transformers_py/ipfs_transformers_generator.py
GitHub
ipfs_transformers_py/ipfs_transformers_py/ipfs_transformers_generat...
a model manager for the Transformers library, implementing S3 and IPFS downloads - endomorphosis/ipfs_transformers_py
ipfs_transformers_py/ipfs_transformers_py/ipfs_transformers_generat...
e... — 1/31/25, 4:56 PM
so eventually when I get all of the permutations figured out, it should be something like this, where I enumerate through all the classes, and generate template code, and then test the template code.
now, I'm not really expecting anything on this high of a level from you guys, but I just want you to get your head around software engineering
for this hackathon, im just looking to see how memory efficient I can get the entire voice to voice pipeline, and if i can get it under the 4gb budget
and not have it sound like absolute shit
one of the ideas i have might involve dynamic loading / unloading of the tts / llm model
ATH🥭 — 1/31/25, 5:52 PM
if I want to work on something, I should make a branch?  give me a TODO  item and I will do it in the branch. 
e... — 1/31/25, 5:54 PM
i think the todo item is to look at https://github.com/endomorphosis/voice_kit_webgpu_cjs
GitHub
GitHub - endomorphosis/voice_kit_webgpu_cjs
Contribute to endomorphosis/voice_kit_webgpu_cjs development by creating an account on GitHub.
GitHub - endomorphosis/voice_kit_webgpu_cjs
Lizardperson — 1/31/25, 6:57 PM
Looked through the code.
e... — 1/31/25, 7:05 PM
whats your status with regards to mounting the iso you just made, and then extracting the files from the iso?
Lizardperson — 1/31/25, 7:06 PM
img is on a virtual mount, most important files are off the img and in zfs
I was just about to pull out my old 6 tb and shove the new ones in there.
e... — 1/31/25, 7:07 PM
Image
e... — 1/31/25, 7:07 PM
well, dont you want to make sure that the img is actually readable first?
not only that but just extracting the data, instead of the block by block level copy will save space, and you might not have the space if you start filling the rest of it up with other stuff
i think you should mount that img in read only, and start to copy stuff off of it and onto the main zfs array 
Lizardperson — 1/31/25, 7:09 PM
That's what I've been doing. With rsync
It's just slow as hell.
e... — 1/31/25, 7:10 PM
yeah, for sure, its probably going to take 2 days or something
Lizardperson — 1/31/25, 7:11 PM
Yeah, rsync's documentation is also kinda terrible. I tried like 3-4 different commands to try to make it so it skips copying things that are already in zfs.
Haven't gotten that to work yet.
Lizardperson — 1/31/25, 8:56 PM
Ok, old 6tb is out.
e... — 1/31/25, 8:58 PM
okay, let me know if you need any more help with data migration issues
Lizardperson — 1/31/25, 8:59 PM
I got it for the most part. Big thing now is porting over my copy of Windows and the new Linux OS over to the 3tb SSD.
e... — 1/31/25, 9:01 PM
okay, we can look at partitioning that ssd in a little bit, but it will have to be tomorrow night or the day after.
I just tried to troubleshoot a motherboard, and tomorrow I will need to try another power supply, by removing the motherboard in my server rack, and trying the motherboard in the server chassis
Lizardperson — 1/31/25, 9:02 PM
That's fine. I wanted to get dinner and work on the omni converter tonight.
e... — 1/31/25, 9:02 PM
and if that doesn't work sending the motherboard back to the ebay seller.
Lizardperson — 1/31/25, 9:02 PM
Damn
e... — 1/31/25, 9:04 PM
okay, with regards to the omni converter, do you understand that you can pass functions, and that at some point for each converter, you can just pass a dummy function, so for example if you had a pdf parser, you would start by extracting the entire pdf in the form of images, and try to pass a dummy function for tesseract, and pass a dummy function for a visual language model, and then iterate through all the pages, and later i will connect that to the model server, such that we can create a graphrag of an entire folder regardless of the file types, that contain media.
or for example, taking the video clip, and then passing into that a function for ffmpeg, where you will split the video and audio tracks, and then using that to compose the conversion into text.
and then I dont know if you have heard of pydantic, but I had thought about using pydantic to structure the data for knowledge graphs.
Lizardperson — 1/31/25, 9:06 PM
I've had to learn pydantic for market agents.
e... — 1/31/25, 9:07 PM
and i honestly haven't even looked at the spreadsheet with the data that you were looking at yet, so I was a bit wary thinking that someone must have already done this
but if it isn't then I suppose it will have to be made or cobbled together from existing parts.
Lizardperson — 1/31/25, 9:08 PM
Oh people have done it. But they haven't done it with built in parallelism and concurrency.
Like markitdown is an amazing library, but it's url parsing is based around requests.
and it doesn't support things like threads out of the box
e... — 1/31/25, 9:09 PM
yeah, that is the same case with llama_index and the chunker that was designed by jina_ai, it was not designed for parallelism, so it ends up only using like 10% gpu utilization
Lizardperson — 1/31/25, 9:09 PM
Yeah, I'm noticing a lot with these libraries.
They're good at what they do. They just do it really inefficiently.
e... — 1/31/25, 9:10 PM
yeah, thats what the polish is about
sometimes people are like, hey developer hours are expensive and machine hours are cheap, until they get BTFO by some chinese people writing assembly.
Lizardperson — 1/31/25, 9:11 PM
I mean, new features are exciting and flashy.
But if it can't scale
e... — 1/31/25, 9:11 PM
yeah, but its like, if I have VC, I can just afford to spin up 10x as many gpus, with no problem
Lizardperson — 1/31/25, 9:12 PM
that's... so wasteful.
Just hire a dev to optimize the code for like 70k+ a year.
Cheaper than getting a few A100s or H100s.
more environmentally friendly as well.
guess Im preaching to the choir though
e... — 1/31/25, 10:02 PM
qualcomm guy
Image
Image
e... — 2/2/25, 3:06 PM
I got the attention of this person, who I got to join the Yannic Kilcher Discord weekend paper discussion about deepseek, and discuss about the ipfs transformers decentralization aspects, in addition to the US government sanctions against chinese ownership of tiktok.
Image
https://github.com/endomorphosis/hallucinate_app/wiki/IPFS-HuggingFace-Bridge-Architecture
GitHub
IPFS HuggingFace Bridge Architecture
Contribute to endomorphosis/hallucinate_app development by creating an account on GitHub.
IPFS HuggingFace Bridge Architecture
updated the wiki
and I got about half way though moving all the test functions to another folder / class
I need to disassemble a motherboard / server, test a motherboard,  and reassemble it again today, and I hope to have gotten through moving  all of my tests to a new file, which can be better hooked into some sort of testing framework / ai maintainance system.
e... — Today at 2:57 AM
https://github.com/endomorphosis/ipfs_accelerate_py/tree/main/ipfs_accelerate_py/test
i have been setting up tests, so that i can do test driven development, and have the AI iterate through which models work or dont, and how to use the error handling to automatically fix code with the AI loop.
likewise getting api backends setup https://github.com/endomorphosis/ipfs_accelerate_py/tree/main/ipfs_accelerate_py/api_backends
and I have been working on getting a LLC bank account setup and funded with 50k
its always some other hoop i have to jump through with the bank and KYC
https://github.com/endomorphosis/ipfs_accelerate_py/blob/main/ipfs_accelerate_py/test/huggingface_model_types.json there are 286 huggingface model types, and instead of writing a "skillset" file for each one, I am going to use some sort of search + rag + code tracing, to try to automatically write the skills such as
https://github.com/endomorphosis/ipfs_accelerate_py/blob/main/ipfs_accelerate_py/worker/skillset/hf_bert.py
e... — Today at 3:04 AM
i saw this code from @ATH🥭  but it looks like its a bare skeleton, https://github.com/endomorphosis/voice_kit_webgpu_cjs/tree/ath-dev

I also noticed placeholder code for gemma, and I didn't know if you realized that I was going to try to use the transformers.js models + rag for the entire pipleline
ATH🥭 — Today at 3:09 AM
Yea I'm going to scrap that whole branch. I just wanted to get in there and move stuff around as I haven't been pushing commits lately
e... — Today at 3:09 AM
ok
ATH🥭 — Today at 3:10 AM
Can I watch while you do all this?
ATH🥭 — Today at 3:26 AM
We can keep it casual. 😁 If you're working on it and you feel like streaming it AND pinging me then I will be there for it.
e... — Today at 2:24 PM
Image
Image
Lizardperson — Today at 4:59 PM
@e... I want to get a jump on this before I start throwing myself at the omni-converter. Do you have a roadmap or anything that needs to get done ASAP?
e... — Today at 5:15 PM
"I was intending on this to be the source of ML model inference that powers the omni converter, so you should look in the repository for the huggingface classes, so you should make a class for each model type that should take as input the splitter, it should have a "source" and a "drain", and then the splitter should take input from the source, and the models should send it to a drain, so that it can be reassembled into text.
e.g. videos, pdfs, etc.