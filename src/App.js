import { useEffect, useState } from "react";
import { compareTwoStrings } from "string-similarity";
// import { stringSimilarity } from "string-similarity-js";
import { diffChars } from "diff";
import "./App.css";

function App() {
  const [searchIndex, setSearchIndex] = useState(null);
  const [logLines, setLogLines] = useState(null);
  useEffect(() => {
    fetch("./search-index.json")
      .then((r) => {
        console.assert(r.ok, r.status);
        return r.json();
      })
      .then((d) => {
        setSearchIndex(new Map(d.map((o) => [o.url, o.title])));
      });
    fetch("./404only.log")
      .then((r) => {
        console.assert(r.ok, r.status);
        return r.text();
      })
      .then((d) => setLogLines(d.split("\n")));
  }, []);
  return (
    <div className="App">
      {searchIndex ? (
        <p>{searchIndex.size.toLocaleString()} known URLs</p>
      ) : (
        <p>
          <i>Downloading searchindex...</i>
        </p>
      )}
      {logLines ? (
        <p>{logLines.length.toLocaleString()} log lines</p>
      ) : (
        <p>
          <i>Downloading log lines...</i>
        </p>
      )}
      {searchIndex && logLines && (
        <button
          type="button"
          onClick={() => {
            const copy = [...logLines].sort(() => Math.random() - 0.5);
            setLogLines(copy);
          }}
        >
          Shuffle log files
        </button>
      )}
      {searchIndex && logLines && (
        <Compare logLines={logLines} searchIndex={searchIndex} />
      )}
    </div>
  );
}

export default App;

function Compare({ logLines, searchIndex }) {
  const [batchSize] = useState(20);
  const [page, setPage] = useState(1);
  const keys = Array.from(searchIndex.keys()).map((k) =>
    k.replace("/en-US/docs/", "")
  );

  function getSuggestion(url, min = 0.86) {
    url = url.replace("/en-US/docs/", "");
    let bestMatch = null;
    let bestRating = 0;

    for (const key of keys) {
      if (url.slice(0, 5) !== key.slice(0, 5)) {
        // Don't even bother if the first 5 characters are different
        continue;
      }
      const rating = compareTwoStrings(url, key);
      // const rating = similarity(url, key);
      // const rating = stringSimilarity(url, key);
      // console.log({ rating, url, key });
      if (rating > min && rating > bestRating) {
        bestRating = rating;
        bestMatch = key;
      }
    }
    return { bestMatch, rating: bestRating };
  }

  const pageM = (page - 1) * batchSize;
  const pageN = page * batchSize;

  let successes = 0;
  const t0 = new Date();
  const trs = logLines.slice(pageM, pageN).map((url) => {
    const { bestMatch, rating } = getSuggestion(url);
    if (rating) {
      successes++;
    }
    return (
      <tr key={url}>
        <td>
          <code>{url}</code>
        </td>
        <td>
          {bestMatch ? (
            <ShowDiff before={url} after={`/en-US/docs/${bestMatch}`} />
          ) : null}
        </td>
        <td>{rating ? <code>{rating.toFixed(2)}</code> : null}</td>
      </tr>
    );
  });
  const t1 = new Date();

  return (
    <div>
      <p>
        Page: {page}{" "}
        <button type="button" onClick={(e) => setPage((s) => s + 1)}>
          Next page &rarr;
        </button>
      </p>
      <table>
        <thead>
          <tr>
            <th>404 URL</th>
            <th>Suggestion</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>{trs}</tbody>
        <tfoot>
          <tr>
            <th colSpan={3} align="right">
              {successes} out of {batchSize} (
              {((100 * successes) / batchSize).toFixed(1)}%)
            </th>
          </tr>
        </tfoot>
      </table>
      <p>
        <small>
          Rendering {batchSize} rows took{" "}
          {(t1.getTime() - t0.getTime()).toFixed(1)}ms (
          {((t1.getTime() - t0.getTime()) / batchSize).toFixed(1)}ms/row)
        </small>
      </p>
    </div>
  );
}

function ShowDiff({ before, after }) {
  const diff = diffChars(before, after);
  const bits = diff.map((part, i) => {
    if (part.added) {
      return <ins key={i}>{part.value}</ins>;
    } else if (part.removed) {
      return <del key={i}>{part.value}</del>;
    } else {
      return <span key={i}>{part.value}</span>;
    }
  });
  return <code>{bits}</code>;
}

// function similarity(s1, s2) {
//   var longer = s1;
//   var shorter = s2;
//   if (s1.length < s2.length) {
//     longer = s2;
//     shorter = s1;
//   }
//   var longerLength = longer.length;
//   if (longerLength === 0) {
//     return 1.0;
//   }
//   return (
//     (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
//   );
// }

// function editDistance(s1, s2) {
//   // s1 = s1.toLowerCase();
//   // s2 = s2.toLowerCase();

//   var costs = [];
//   for (var i = 0; i <= s1.length; i++) {
//     var lastValue = i;
//     for (var j = 0; j <= s2.length; j++) {
//       if (i === 0) costs[j] = j;
//       else {
//         if (j > 0) {
//           var newValue = costs[j - 1];
//           if (s1.charAt(i - 1) !== s2.charAt(j - 1))
//             newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
//           costs[j - 1] = lastValue;
//           lastValue = newValue;
//         }
//       }
//     }
//     if (i > 0) costs[s2.length] = lastValue;
//   }
//   return costs[s2.length];
// }
