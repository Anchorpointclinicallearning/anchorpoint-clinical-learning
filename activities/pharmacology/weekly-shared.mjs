export const label=id=>`https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${id}`;
export const drugSource=name=>({name:`DailyMed · ${name} labeling`,url:`https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(name)}`});
export function makeWeek(n,rows){return rows.map(([topic,drug,question,options,rationale,puzzle,clue,source,focus='Clinical reasoning'],i)=>({id:`w${n}-practice-${String(i+1).padStart(2,'0')}`,topic,drug,question,options,answer:0,rationale,puzzle,clue,puzzleType:'Clinical concept',source,focus,week:`Unit ${n}`,courses:['course1']}));}
