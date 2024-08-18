ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "title" text DEFAULT '';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
