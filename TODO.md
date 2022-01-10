# TODO


## testing

- Testing with the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
  - Authentication
    - Ensure only logged in users can search
    - Ensure only logged in users can view evaluations
  - Firestore
    - Run some operations and check that the Firestore document matches what is expected
      - Creating a new schedule via the schedule page
      - Creating a new schedule via the planning page


## contact form

### concentration request page

- On the planning page, create a link "suggest a concentration"
  - Your request has been received! You can view which concentrations have been suggested


ui: a list of suggested concentrations with the data below
- number of users requested
- upvote button: click toggles

```ts
updateDoc(doc(`concentrationRequests/${concentration}`), {
  userEmails: arrayToggle(user.email) // or something
})
```

the `concentrationRequests` collection in firestore

id is the concentration

(where get concentrations from?)
- does my.harvard have a list? check application
- if not, can copy+paste from handbook

```ts
type Suggestion = {
  userEmails: string[]; // array of users who voted
  suggestedConcentration: string;
  status: 'Received' | 'Done' | 'In progress';
  completionDate?: Date;
}
```


## store things in `localStorage` (Web Storage API)

what should stay the same between user logins?
  - search state
  - selected schedule on schedule page
  - When user navigates between pages, it should save their search state
    - Could just put this in context served from app


## search page

- "Clear" button for each facet
- "Reset search" under search bar
- show subject full titles instead of abbreviations
  - truncate
- "Surprise me"
  - search for e.g. random sorting method, random subject, etc?
  - based on selected courses?
    - does Meilisearch support randomness? might need to do this with some sort of ML / NLP application
    - or check what other students are taking
      - query Firestore:
        - collection users where Object.values(user.schedule).some((schedule) => schedule.classes.includes(classId))


## planning page

- resizable requirements section
  - kinda like vs code: has a min width, and then if you keep dragging, it collapses, and then you can drag again from the lhs
  - or maybe just a hide/show button
- language requirements in college requirements
- handle gened edge case
- search by requirement
- selected schedules should be saved in firestore


## schedule page

- add export to calendar function
