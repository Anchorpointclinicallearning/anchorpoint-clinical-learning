export const WHEEL_VALUES = [200,400,600,300,500,800,400,1000];
export const normalize = s => String(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
export function shuffle(items,rng=Math.random){const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function newProgress(){return {attempts:0,correct:0,points:0,items:{}};}
export class Game {
 constructor(bank,type,options={}){
  if(!['wheel','casino'].includes(type))throw Error('Unknown game');
  this.bank=bank;this.type=type;this.rng=options.rng||Math.random;
  this.ids=shuffle(bank.map(x=>x.id),this.rng);this.index=-1;this.round=null;
  this.teamCount=options.teamCount||1;this.teams=Array(this.teamCount).fill(0);
  this.activeTeam=0;this.attempts=0;this.correct=0;this.points=0;this.results=[];
 }
 get item(){return this.round ? this.bank.find(x=>x.id===this.round.id) : null;}
 get done(){return this.index>=this.ids.length-1&&(!this.round||this.round.resolved);}
 next(){
  if(this.round&&!this.round.resolved)return false;
  if(this.index+1>=this.ids.length)return false;
  if(this.round)this.activeTeam=(this.activeTeam+1)%this.teamCount;
  this.index++;
  const id=this.ids[this.index],q=this.bank.find(x=>x.id===id);
  this.round={id,resolved:false,guessed:[],pending:0,assisted:false,errors:0,earned:0,choice:null,order:shuffle(q.options.map((_,i)=>i),this.rng),multiplier:1+Math.floor(this.rng()*3)};
  return true;
 }
 spin(){
  if(this.type==='casino'){
   if(!this.next())return null;
   return this.round;
  }
  if(!this.round||this.round.resolved||this.round.pending)return null;
  const segment=Math.floor(this.rng()*WHEEL_VALUES.length);
  this.round.pending=WHEEL_VALUES[segment];return {segment,value:this.round.pending};
 }
 addPoints(n){this.points+=n;this.round.earned+=n;this.teams[this.activeTeam]+=n;}
 visible(){return this.item ? [...this.item.puzzle].map(c=>!/[A-Z]/.test(c)||this.round.guessed.includes(c)||this.round.resolved?c:'_').join('') : '';}
 guess(letter){
  if(this.type!=='wheel'||!this.round||this.round.resolved||!this.round.pending||! /^[A-Z]$/.test(letter)||this.round.guessed.includes(letter))return null;
  this.round.guessed.push(letter);const count=[...this.item.puzzle].filter(c=>c===letter).length;
  this.addPoints(count*this.round.pending);this.round.pending=0;
  if(!count)this.round.errors++;
  if(!this.visible().includes('_'))this.finish(!this.round.assisted,'letters');
  return count;
 }
 solve(value){
  if(this.type!=='wheel'||!this.round||this.round.resolved||!normalize(value))return null;
  if(normalize(value)===normalize(this.item.puzzle)) {if(!this.round.assisted)this.addPoints(500);this.finish(!this.round.assisted,'solve');return true;}
  this.round.errors++;return false;
 }
 hint(){
  if(this.type!=='wheel'||!this.round||this.round.resolved)return null;
  const missing=[...new Set([...this.item.puzzle].filter(c=>/[A-Z]/.test(c)&&!this.round.guessed.includes(c)))];
  const letter=missing[0];this.round.assisted=true;if(letter)this.round.guessed.push(letter);
  if(!this.visible().includes('_'))this.finish(false,'hint');return letter;
 }
 answer(index){
  if(this.type!=='casino'||!this.round||this.round.resolved||!Number.isInteger(index)||!this.round.order.includes(index))return null;
  this.round.choice=index;const correct=index===this.item.answer;
  if(correct)this.addPoints(100*this.round.multiplier);
  this.finish(correct,'answer');return correct;
 }
 reveal(){if(!this.round||this.round.resolved)return false;this.round.assisted=true;this.finish(false,'reveal');return true;}
 finish(correct,method){
  if(this.round.resolved)return false;
  this.round.resolved=true;this.round.correct=correct;this.round.pending=0;this.round.method=method;
  this.attempts++;if(correct)this.correct++;
  this.results.push({id:this.item.id,correct,points:this.round.earned,type:this.type});return true;
 }
 snapshot(){const {bank,rng,...data}=this;return data;}
 static restore(bank,data){
  if(!data||!['wheel','casino'].includes(data.type)||!Array.isArray(data.ids)||data.ids.some(id=>!bank.some(x=>x.id===id)))return null;
  if(data.round&&!bank.some(x=>x.id===data.round.id))return null;
  const game=new Game(bank,data.type,{teamCount:data.teamCount});Object.assign(game,data);return game;
 }
}
export function recordProgress(progress,result){
 progress.attempts++;if(result.correct)progress.correct++;progress.points+=result.points;
 const old=progress.items[result.id]||{attempts:0,correct:0};
 progress.items[result.id]={attempts:old.attempts+1,correct:old.correct+(result.correct?1:0),lastCorrect:result.correct,game:result.type};
 return progress;
}
