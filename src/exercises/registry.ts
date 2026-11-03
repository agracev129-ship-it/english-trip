// Каждый тип задания — свой компонент с общим интерфейсом (PROJECT.md, раздел 6).
import type { ComponentType } from 'react';
import type { LessonItem } from '../lib/lessonBuilder';
import { AiConversation } from './AiConversation';
import { BossWeek } from './BossWeek';
import { BranchingDialog } from './BranchingDialog';
import { CatchTheWord } from './CatchTheWord';
import { DialogComprehension } from './DialogComprehension';
import { DictationTiles } from './DictationTiles';
import { DictationTyping } from './DictationTyping';
import { FlashcardSwipe } from './FlashcardSwipe';
import { InteractiveTranscript } from './InteractiveTranscript';
import { MatchPairs } from './MatchPairs';
import { MinimalPairs } from './MinimalPairs';
import { NumbersListen } from './NumbersListen';
import { PatternBuilder } from './PatternBuilder';
import { SayIt } from './SayIt';
import { Shadowing } from './Shadowing';
import { SpeedLadder } from './SpeedLadder';
import { WordIntro } from './WordIntro';
import { WordListenChoice } from './WordListenChoice';
import { WordListenSpell } from './WordListenSpell';
import type { ExerciseProps } from './types';

export const EXERCISES: { [K in LessonItem['kind']]: ComponentType<ExerciseProps<K>> } = {
  word_intro: WordIntro,
  word_listen_choice: WordListenChoice,
  word_listen_spell: WordListenSpell,
  flashcard_swipe: FlashcardSwipe,
  match_pairs: MatchPairs,
  minimal_pairs: MinimalPairs,
  numbers_listen: NumbersListen,
  dialog_comprehension: DialogComprehension,
  interactive_transcript: InteractiveTranscript,
  dictation_tiles: DictationTiles,
  dictation_typing: DictationTyping,
  catch_the_word: CatchTheWord,
  speed_ladder: SpeedLadder,
  shadowing: Shadowing,
  say_it: SayIt,
  pattern_builder: PatternBuilder,
  branching_dialog: BranchingDialog,
  boss_week: BossWeek,
  ai_conversation: AiConversation,
};
