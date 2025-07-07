# Project description

### Author: 
    This project is built by Dinh Vu Ha, for any contact, please mail via: dinhvuha2012@gmail.com
### Description:
    This project is built to solve multiple files OCR in bank loan for kind of files such as:
        +) Business Registration Certificate
        +) Company Charter 
        +) Financial Statements
        +) Bank Statement
        +) Active Large Contracts
        +) Citizen ID Card of Legal Representative
        +) Current Asset Records
    For Financial Statements, which usually cover up to 100 pages and sometime we have to process multiple of them, makes OCR nearly impossible for traditional Chatbot. So i build this project to 1 click OCR and make smart judgements base on these files.
### What this project can do:
    +) Multi-process OCR pipeline: Normally if you are a bank employee who is capable of processing bank loaning documents for your customer a company, you have to read all above documents manually and spend like half a day reading all of them. To help you in that case, I build an OCR pipeline to process all the documents automatically in just barely 3~10 minutes. In order to make OCR for 200 pages per upload, we have to have a multi-process OCR pipeline which can split documents into chunks to make OCR process faster but still has to be very precise.
    +) Information collector: Collect all important data in the documents and show them in a editable table.
    +) Data checker: When upload documents for bank loaning, we may face with some files missing (your Citizen ID Card only has 1 side which requires both 2 sides) or even worse when Financial Statements missing 1 page. 
    +) Anomoly detector: When someone want to loan money from your bank, you may face with faking profiles, information which leads to unsafe work. So our OCR system has to be capable of detecting them.
    +) Insights collector: If our uploaded documents are safe to process and don't miss any details, we may have to make a deep analysis. 
# Technology

### Website, UIUX:
    Front-End: ReactJS, TailwindCSS.
    Back-End: ExpressJS.
### OCR, AI Agents:
    Model: Gemini 2.5 Flash.
    OCR and AI Agents:  ocr.py: Multi-process OCR
                        and many mores ...


