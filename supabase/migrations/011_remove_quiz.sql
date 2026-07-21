-- Remove the retired Quiz game and its database API.

DROP FUNCTION IF EXISTS games.update_question_vote_count();
DROP FUNCTION IF EXISTS games.increment_question_shown(UUID[]);
DROP FUNCTION IF EXISTS games.record_question_result(INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS games.report_question(INTEGER);
DROP FUNCTION IF EXISTS games.like_question(INTEGER);
DROP FUNCTION IF EXISTS games.dislike_question(INTEGER);

DROP TABLE IF EXISTS games.quiz_question_votes CASCADE;
DROP TABLE IF EXISTS games.quiz_questions CASCADE;
DROP TABLE IF EXISTS games.quiz_rooms CASCADE;
