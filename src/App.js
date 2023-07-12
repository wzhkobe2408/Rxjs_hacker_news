import React from 'react';
import axios from 'axios';
import { BehaviorSubject, combineLatest, timer } from 'rxjs';
import { flatMap, map, debounce, filter } from 'rxjs/operators';
import './App.css';

import withObservableStream from './withObservableStream';

const SUBJECT = {
  POPULARITY: 'search',
  DATE: 'search_by_date',
};

const App = ({
  query,
  subject,
  page,
  stories,
  onChangeQuery,
  onSelectSubject,
  onChangePage,
}) => (
  <div>
    <h1>Hacker News By RxJS</h1>

    <div className="container">
      <input
        type="text"
        value={query}
        onChange={event => onChangeQuery(event.target.value)}
      />

      <div className="button-group">
        <span className="tag">Tags:</span>
        {Object.values(SUBJECT).map(subject => (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            type="button"
          >
            {subject}
          </button>
        ))}
      </div>

      {
        stories.length > 0 ? (
          <>
            <ul>
              {stories.map(story => (
                <li key={story.objectID}>
                  <a href={story.url || story.story_url}>
                    {story.title || story.story_title}
                  </a>
                  <div>
                    author: { story.author || 'unknow' }
                  </div>
                  <div>
                    createdAt: { story.created_at }
                  </div>
                  <div>
                    comments: { story.num_comments || 0 }
                  </div>
                </li>
              ))}
            </ul>

            <div className="button-group">
              <button
                onClick={() => onChangePage(page + 1)}
              >
                Next Page
              </button>
              <button
                onClick={() => onChangePage(page - 1)}
              >
                Prev Page
              </button>
            </div>
          </>
        ) : (
          <div className="loading-hint">Loading...</div>
        )
      }

    </div>
  </div>
);

const query$ = new BehaviorSubject('react');
const subject$ = new BehaviorSubject(SUBJECT.POPULARITY);
const page$ = new BehaviorSubject(0).pipe(
  filter((page) => page >= 0),
);

const queryForFetch$ = query$.pipe(
  debounce(() => timer(1000)),
  filter(query => query !== ''),
);

const fetch$ = combineLatest(subject$ , page$, queryForFetch$).pipe(
  flatMap(([subject, page, query]) =>
    axios(`https://hn.algolia.com/api/v1/${subject}?query=${query}&page=${page}`),
  ),
  map(result => {
    console.log('result', result);

    return result.data.hits;
  }),
);

export default withObservableStream(
  // observable
  combineLatest(
    subject$,
    query$,
    page$,
    fetch$,
    (subject, query, page, stories) => ({
      subject,
      query,
      page,
      stories,
    }),
  ),
  {
    // subject observable trigger
    onSelectSubject: subject => subject$.next(subject),
    // query observable trigger
    onChangeQuery: value => query$.next(value),
    onChangePage: page => page$.next(page),
  },
  {
    // init state
    query: 'react',
    subject: SUBJECT.POPULARITY,
    page: 0,
    stories: [],
  },
)(App);
