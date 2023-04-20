import React, { useCallback, useRef, useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import {
  arrayUnion,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import { Auth } from '@/src/features';
import { classNames } from '@/src/utils';
import FadeTransition from '../FadeTransition';

export function SuggestionForm() {
  const uid = Auth.useAuthProperty('uid');
  const email = Auth.useAuthProperty('email');

  const timeoutRef = useRef<number>();

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const showMessage = useCallback(() => {
    setShow(true);
    timeoutRef.current = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        timeoutRef.current = undefined;
      }, 1000);
    }, 2000) as unknown as number;
  }, []);

  const submitSuggestion = useCallback(
    async (ev: any) => {
      ev.preventDefault();
      // only allow user to submit every 2 seconds
      if (typeof timeoutRef.current !== 'undefined') return;
      if (!uid) {
        setSuggestion('You must be logged in to give suggestions!');
        showMessage();
        return;
      }

      const program = new FormData(ev.currentTarget)
        .get('program')
        ?.toString()
        .trim()
        .toLowerCase();
      if (!program) return;

      const db = getFirestore();
      try {
        const existing = await getDoc(doc(db, 'suggestions', uid));
        const suggestions: string[] | undefined = existing.get('suggestions');
        if (suggestions && suggestions.length >= 10) {
          setSuggestion(
            'You may only make up to ten suggestions. Please check back later.',
          );
        } else if (suggestions?.includes(program)) {
          setSuggestion('You have already suggested that program!');
        } else {
          await setDoc(
            existing.ref,
            {
              suggestions: arrayUnion(program),
              userEmail: email,
            },
            { merge: true },
          );
          setSuggestion(
            `Suggestion successfully recorded! (${(suggestions?.length || 0) + 1}/10)`,
          );
        }
      } catch (err) {
        console.error('error updating suggestion', err);
        setSuggestion(
          'There was an error recording your suggestion. Please try again.',
        );
      } finally {
        showMessage();
      }
    },
    [email, uid],
  );

  return (
    <div>
      <form className="flex justify-center" onSubmit={submitSuggestion}>
        <input
          type="text"
          name="program"
          id="program"
          placeholder="Program"
          className={classNames(
            'flex-1 appearance-none border rounded w-full py-1 px-2 text-gray-dark',
            'focus:outline-none focus:shadow-lg shadow transition-shadow max-w-[16rem]',
          )}
        />
        <button
          type="submit"
          className="group relative ml-2 rounded bg-black/30 p-2 transition-colors hover:bg-black/50"
        >
          <FaEnvelope />
          <span className="absolute right-0 top-full z-10 mt-2 hidden w-32 rounded bg-black/80 p-2 text-sm text-white group-hover:block">
            Your email will be recorded when making a suggestion.
          </span>
        </button>
      </form>
      <FadeTransition show={show}>
        <p className="mt-1 pl-2 text-center text-xs text-gray-dark">
          {suggestion}
        </p>
      </FadeTransition>
    </div>
  );
}
