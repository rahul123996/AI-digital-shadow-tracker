const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'backend', 'serviceAccountKey.json');
const content = fs.readFileSync(filePath, 'utf8');

try {
    // If it has literal newlines, we need to escape them before parsing.
    // This is a common issue when pasting into some editors.
    const escapedContent = content.replace(/\n/g, '\\n').replace(/\r/g, '');
    
    // But wait, the whole JSON object is on multiple lines. We only want to escape newlines inside the values.
    // This is hard with regex. 
    
    // Let's try to just fix the private_key specifically if it's the problem.
    // Actually, I'll just write the whole thing from scratch using the user's data.
    
    const data = {
        "type": "service_account",
        "project_id": "gen-lang-client-0068521735",
        "private_key_id": "4c4a6c118ac7bca62efdcb4c9a8d881f577161ce",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDYu/W3cePnFpla\n8+SAejD9a74nOf1H10GdAfKWRjRZQsL6uE1sfmqI1xn30E3pWDjQVHgkLDj7hW4v\n5rIjbqVSHYhqK95V4KoAwNZ8/aLwlOP4wVBxn24LKeTCnKRZsEsQlQQ9uIhB0dJ0\nUIpKJZeNUCcburpEvhrVgWJ2OkvIVuVhD4isakH02DCACiQj65RCQcdfPc4BWIgi\nTecocYBcX2F/NPZAlHbv2UNhqmd0DvsHqVsLMorlgHnYhqstPjxso37S4HGc5rRJ\nptK3W91IOPFIx4EoUAtwW2cb1PW+XwLZpAsXoR299xW0iznjTmcODRuOtttVey0T\nO0M89roJAgMBAAECggEAYiMByPXF9z5RZFCpN8+cXTOrH4HvgNckO57FJGxXic9k\nEDjhve2j+aBEfuSQUseCujp1SBPKHYG2efQg11BjhUIgIcsJWqNm9v5aYLBMVllk\nvJ9z+G7zWhS3I7Pf60ibRL/k8rma4QrMG6TYaWiKLg+MFc9ARp458lEqr1QIOobg\n750S4fVSQVQPYx+HmMhKwAFoT05VX9Y2fAwuMdyZ6U6crOSSpw+L904nB4cdgoiN\nRhNbQDceIEjCX+gQiFZRmzohceHzfz7AInSM/yk4NrjIb8W+97ymcr0iZxiqrHtc\n9VWofsadihtE6fHIihcX085vni1VX/FfRT3v8xkf3QKBgQDvhgMIuNR1tVh1AWhc\nHIHFVDlDfGKXVg+eTCFDX60hlnMZPXhYFuQitTPshdwzXWwjnhhcAOheGmOEOk0r\nhe3+HfQ9Hr0BYnQtShSKWQA2nNO1HlUzWUztjigQfwnrQAs2uFDRCA/EBgykeI+o\neuFDYBwfsOTshYIL8ALXEVfwhwKBgQDnpKGF+QStF1I+7BbiQqVUHcORMO6Mh7G5\n5TJONMSCnA+vzvSIL1ijMP3QEVnI3EZ8FXDtetB9vDCUZ9idsnyGctDcX47WshTh\nWEz4ncws+M29FGu06XB35GU1ZbgXBK4+19zXw292MqaZ347Qg5P4Id2qMP3JZUd5\n4nuxTiB07wKBgFTPKaHb9/ZZqKF9RxteSKC7Kq93il01bsBJCnoVlXLQF573QfZG\n3K5hZKo513ckfBa8crmY5K31QAlgr1RazqLsrj859AhaePJUSaOW0dmEe/2kaNyO\noQt4Cz2UDcoLWi0c5Bivdw2caruNqKgqIjq9/BdIhjYtK5fYetj13iJfAoGAbzM8\nCxl44jMQ233wmluODGxhZsDLs5Csg+YAGUUBlQWgDjDWeM3pyiWJoqnBpUgBWi3c\n0VQk5EdENuoHNeTqHIzfsPr6khxZI7iE8tClpG0oLv2vmuB5ikSNRW34SqyHjUmJ\nDdcXGfHEwpdscrLHhNWVGM999YF2J4/O+1XbBOcCgYBW09jVChHcLn9frfcuZCCr\nsYwttIm1cVp6TCFSr5nFnDI+RkkBOZysZ5rUyFuBrbpbcFxqzi9foS3NtUf/G0U5\npFW6YbV+94DdMA624/M3WSieXXvps6LJX9GO21VI0Qt6a0uc07CiPQWi1BX7QPgE\nui34wUL4YWZGoD0lmwCZIg==\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@gen-lang-client-0068521735.iam.gserviceaccount.com",
        "client_id": "113953364445663438476",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gen-lang-client-0068521735.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("JSON generated from scratch and saved.");
} catch (e) {
    console.log("JSON generation failed:", e.message);
}
