CREATE TABLE "chess" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"fen" varchar(256) NOT NULL,
	"status" varchar(64) NOT NULL,
	"turn" varchar(2) NOT NULL,
	"opponent_type" varchar(16) NOT NULL,
	"player_color" varchar(8) NOT NULL,
	"players" json NOT NULL,
	"moves" text[] NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chess" ADD CONSTRAINT "chess_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;