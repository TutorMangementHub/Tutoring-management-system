CREATE TYPE "public"."notification_type" AS ENUM('session_created', 'session_postponed', 'session_rescheduled', 'session_cancelled', 'session_updated');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'teacher', 'student');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('planned', 'started', 'postponed', 'finished', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('exam_prep', 'explanation', 'homework_help');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('middle', 'high');--> statement-breakpoint
CREATE TABLE "closed_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"reason" text,
	CONSTRAINT "closed_dates_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "free_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_min" integer NOT NULL,
	"end_min" integer NOT NULL,
	CONSTRAINT "free_slots_day_valid" CHECK ("free_slots"."day_of_week" between 1 and 7),
	CONSTRAINT "free_slots_range_valid" CHECK ("free_slots"."start_min" >= 0 and "free_slots"."end_min" <= 1440 and "free_slots"."start_min" < "free_slots"."end_min")
);
--> statement-breakpoint
CREATE TABLE "grade_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"stage" "stage" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade_level_id" uuid NOT NULL,
	"number" smallint NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"join_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_student_count_positive" CHECK ("groups"."student_count" >= 0),
	CONSTRAINT "groups_number_positive" CHECK ("groups"."number" > 0)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"session_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_groups" (
	"session_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "session_groups_session_id_group_id_pk" PRIMARY KEY("session_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "session_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"from_status" "session_status",
	"to_status" "session_status" NOT NULL,
	"reason" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "session_type" NOT NULL,
	"date" date NOT NULL,
	"start_min" integer NOT NULL,
	"end_min" integer NOT NULL,
	"status" "session_status" DEFAULT 'planned' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"has_conflict" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_range_valid" CHECK ("sessions"."start_min" >= 0 and "sessions"."end_min" <= 1440 and "sessions"."start_min" < "sessions"."end_min"),
	CONSTRAINT "sessions_version_non_negative" CHECK ("sessions"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"time_zone" text NOT NULL,
	"open_min" integer NOT NULL,
	"close_min" integer NOT NULL,
	"middle_latest_end_min" integer NOT NULL,
	"high_latest_end_min" integer NOT NULL,
	"operating_days" jsonb NOT NULL,
	"buffer_minutes" integer NOT NULL,
	"grid_minutes" integer NOT NULL,
	"min_duration_minutes" integer NOT NULL,
	"max_duration_minutes" integer NOT NULL,
	"default_duration_minutes" integer NOT NULL,
	"min_lead_minutes" integer NOT NULL,
	"warn_lead_minutes" integer NOT NULL,
	"max_students_per_session" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("settings"."id" = 1),
	CONSTRAINT "settings_hours_valid" CHECK ("settings"."open_min" >= 0 and "settings"."open_min" < "settings"."close_min" and "settings"."close_min" <= 1440)
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "role" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "free_slots" ADD CONSTRAINT "free_slots_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_grade_level_id_grade_levels_id_fk" FOREIGN KEY ("grade_level_id") REFERENCES "public"."grade_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_groups" ADD CONSTRAINT "session_groups_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_groups" ADD CONSTRAINT "session_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_status_history" ADD CONSTRAINT "session_status_history_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_status_history" ADD CONSTRAINT "session_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "free_slots_group_day_idx" ON "free_slots" USING btree ("group_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "free_slots_group_day_start_unique" ON "free_slots" USING btree ("group_id","day_of_week","start_min");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_grade_number_unique" ON "groups" USING btree ("grade_level_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_join_code_unique" ON "groups" USING btree ("join_code");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_hash_unique" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_groups_group_idx" ON "session_groups" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "session_status_history_session_idx" ON "session_status_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sessions_date_status_idx" ON "sessions" USING btree ("date","status");--> statement-breakpoint
CREATE INDEX "sessions_teacher_date_idx" ON "sessions" USING btree ("teacher_id","date");--> statement-breakpoint
CREATE INDEX "student_profiles_group_idx" ON "student_profiles" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));